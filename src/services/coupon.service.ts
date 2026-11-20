import { CouponDef } from "../types";

export const PROMO_COUPONS: CouponDef[] = [
  { code: "PICKPAL50", title: "50% Off First Service", discountPercent: 50, maxDiscount: 99, active: true },
  { code: "FREEDEL", title: "Free Service Delivery", discountAmount: 49, active: true },
  { code: "REPAIR30", title: "₹30 Off Hardware & Repairs", discountAmount: 30, minOrder: 200, active: true },
];

export class CouponService {
  public static validateCoupon(code: string, subtotal: number): { valid: boolean; discount: number; message: string } {
    const coupon = PROMO_COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
    if (!coupon) {
      return { valid: false, discount: 0, message: "Invalid or expired coupon code" };
    }

    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return { valid: false, discount: 0, message: `Minimum order of ₹${coupon.minOrder} required for this coupon` };
    }

    let discount = 0;
    if (coupon.discountAmount) {
      discount = coupon.discountAmount;
    } else if (coupon.discountPercent) {
      discount = (subtotal * coupon.discountPercent) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    return { valid: true, discount: Math.round(discount), message: `Coupon ${coupon.code} applied!` };
  }
}
