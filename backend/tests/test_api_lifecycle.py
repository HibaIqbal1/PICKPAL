import io
import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient

from backend.app.main import app, startup_event


class TestPickPalLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        startup_event()
        cls.client = TestClient(app)

    def test_01_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_02_complete_order_and_escrow_lifecycle(self):
        # 1. Customer creates an order
        order_payload = {
            "store_name": "Guru Sweets Mysore",
            "category": "Sweets",
            "items_description": "Mysore Pak 1kg Special Box",
            "shipping_tier": "LOCAL",
            "budget_cap": 600.0,
            "delivery_fee": 50.0,
        }
        create_res = self.client.post(
            "/api/orders",
            json=order_payload,
            headers={"Authorization": "Bearer CUST_001"},
        )
        self.assertEqual(create_res.status_code, 200, create_res.text)
        order = create_res.json()
        order_id = order["id"]
        delivery_otp = order.get("delivery_otp")

        self.assertEqual(order["status"], "searching_worker")
        self.assertEqual(order["budget_cap"], 600.0)
        self.assertEqual(order["delivery_fee"], 50.0)
        # Service fee is 5% of delivery fee (2.50)
        self.assertEqual(order["service_fee"], 2.50)
        # Total amount: 600 + 50 + 2.50 = 652.50
        self.assertEqual(order["total_amount"], 652.50)
        self.assertIsNotNone(delivery_otp)
        self.assertEqual(len(delivery_otp), 4)

        # Verify Escrow record exists and status is HELD
        escrow_res = self.client.get(
            f"/api/orders/{order_id}/escrow",
            headers={"Authorization": "Bearer CUST_001"},
        )
        self.assertEqual(escrow_res.status_code, 200, escrow_res.text)
        escrow = escrow_res.json()
        self.assertEqual(escrow["status"], "HELD")
        self.assertEqual(escrow["amount_held"], 652.50)

        # 2. Worker views open job board
        list_res = self.client.get(
            "/api/orders?status_filter=searching_worker",
            headers={"Authorization": "Bearer WORKER_001"},
        )
        self.assertEqual(list_res.status_code, 200)
        orders_list = list_res.json()
        self.assertTrue(any(o["id"] == order_id for o in orders_list))

        # 3. Worker claims the order
        claim_res = self.client.post(
            f"/api/orders/{order_id}/claim",
            headers={"Authorization": "Bearer WORKER_001"},
        )
        self.assertEqual(claim_res.status_code, 200, claim_res.text)
        claimed_order = claim_res.json()
        self.assertEqual(claimed_order["status"], "assigned")
        self.assertEqual(claimed_order["worker_id"], "WORKER_001")

        # 4. Worker records store purchase and uploads store receipt
        fake_receipt = io.BytesIO(b"STORE_RECEIPT_PROOF_BYTES_MOCK")
        receipt_res = self.client.post(
            f"/api/orders/{order_id}/store-purchase",
            data={"actual_item_cost": "580.0"},
            files={"receipt_file": ("receipt.jpg", fake_receipt, "image/jpeg")},
            headers={"Authorization": "Bearer WORKER_001"},
        )
        self.assertEqual(receipt_res.status_code, 200, receipt_res.text)
        in_transit_order = receipt_res.json()
        self.assertEqual(in_transit_order["status"], "in_transit")
        self.assertEqual(in_transit_order["actual_item_cost"], 580.0)
        self.assertIsNotNone(in_transit_order["store_receipt_url"])

        # 5. Worker verifies delivery with incorrect OTP -> Should Fail (400)
        bad_otp_res = self.client.post(
            f"/api/orders/{order_id}/complete-delivery?otp=0000",
            headers={"Authorization": "Bearer WORKER_001"},
        )
        self.assertEqual(bad_otp_res.status_code, 400)

        # 6. Worker verifies delivery with correct OTP -> Payout released & settled
        complete_res = self.client.post(
            f"/api/orders/{order_id}/complete-delivery?otp={delivery_otp}",
            headers={"Authorization": "Bearer WORKER_001"},
        )
        self.assertEqual(complete_res.status_code, 200, complete_res.text)
        settled_escrow = complete_res.json()
        self.assertEqual(settled_escrow["status"], "RELEASED")
        # Worker payout: actual_item_cost (580) + delivery_fee (50) = 630.00
        self.assertEqual(settled_escrow["amount_released"], 630.00)
        # Customer refund: held (652.50) - (worker_payout 630 + service_fee 2.50) = 20.00
        self.assertEqual(settled_escrow["amount_refunded"], 20.00)

        # 7. Final Order status check
        final_order_res = self.client.get(
            f"/api/orders/{order_id}",
            headers={"Authorization": "Bearer CUST_001"},
        )
        self.assertEqual(final_order_res.status_code, 200)
        self.assertEqual(final_order_res.json()["status"], "delivered")


if __name__ == "__main__":
    unittest.main()
