# PickPal Payments & Wallet Guide

## PickPal Wallet Architecture

PickPal features an integrated digital wallet system (`/wallets/{userId}`) that enables instant payments, wallet top-ups, transaction logging, and automated worker payout settlements.

### User Wallet Balances
- Every customer and worker profile maintains a real-time `walletBalance` field.
- Wallet balances update instantly when funds are added, orders are completed, or refunds are processed.

### Transaction Logs & Payment Types
All financial transactions are stored in `/wallets/{userId}/transactions` with fields:
- `type`: `"credit"` (adding money, earning) or `"debit"` (paying for order/booking).
- `amount`: Monetary value in ₹ (INR).
- `description`: Transaction memo (e.g., "Paid for Order #12345", "Added money via UPI").
- `paymentMethod`: Supported options include `UPI`, `Card`, `QR Code`, `Net Banking`, `Wallet Settlement`.
- `status`: `"success"`, `"pending"`, `"failed"`.
- `referenceId`: Unique transaction ID or external payment gateway reference.

### Payment Gateways & Top-Up Methods
- Customers top up their wallet balance using the **Add Money** interface (`AddMoneyModal.tsx`).
- Supported modes: UPI Apps (GPay, PhonePe, Paytm), Credit/Debit Cards, QR Code scan, Net Banking.
- *Gateway Status*: The payment UI modal and service stub (`payment-gateway.service.ts`) are fully implemented; live Razorpay webhooks are scheduled for production gateway integration.

### Invoices & Receipts
- Upon order completion, PickPal generates an itemized PDF invoice record (`InvoiceRecord`).
- Captures: `orderId`, `customerId`, `customerName`, `workerName`, `storeName`, `category`, `date`, `amount`, `commission`, `gst`, `totalPaid`, `items`, `pdfUrl`.

### Payment Statuses
- `paymentStatus: "paid"`: Funds successfully debited from customer wallet/card.
- `paymentStatus: "pending"`: Payment authorization in progress.
- `paymentStatus: "refunded"`: Order cancelled; funds credited back to customer wallet.
