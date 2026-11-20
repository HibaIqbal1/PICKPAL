# PickPal Workers & Partners Guide

## Worker Onboarding & Application Process

PickPal Delivery Partners and Service Workers are verified individuals who fulfill customer errand requests, home repairs, or shop service packages.

### Worker Profile & Categories
- **Worker Types**:
  - `home_visit`: Technicians and errand runners traveling to customer locations.
  - `shop_service`: In-shop staff members providing salon, barber, spa, or tailoring services.
- **Service Categories**: Hardware, Groceries, Pharmacy, Electronics, Cleaning, Beauty, Courier/Pick & Drop.

### Onboarding & Identity Verification
During registration, workers complete an identity verification application requiring:
1. **Government Identification Documents**:
   - Aadhaar Card Number (`aadhaarNumber`), Aadhaar Front Image (`aadhaarFront`), Aadhaar Back Image (`aadhaarBack`).
   - PAN Card Number (`panNumber`).
2. **Personal Verification**:
   - Clear Live Selfie photo (`selfie`).
   - Phone and Email OTP verification (`otpVerified`).
   - Address details, skills list, and prior experience.
3. **Banking Details for Payouts**:
   - Bank Account Number, IFSC Code, Account Holder Name, or UPI ID.

### Approval & Status Workflow
- **Initial State**: Newly registered worker profiles receive `verificationStatus: "pending"` and `status: "pendingApproval"`.
- **Admin Audit**: Platform administrators audit uploaded identity proofs on the Admin Control Panel.
- **Approval / Rejection**:
  - If verified: Admin approves account (`status: "active"`, `verified: true`, `approvedAt: ISO timestamp`).
  - If rejected: Admin marks account (`verificationStatus: "rejected"`, `rejectionReason: "Reason string"`).

### Worker Operations & Availability

1. **Online / Offline Toggle**:
   - Workers toggle their operational status using `isAvailable: true / false`.
   - When **Online**, worker GPS location is streamed and job offers appear on their dashboard feed.

2. **Operating Radius & Job Parameters**:
   - Workers define an operating radius (e.g., 5 km, 10 km).
   - Metrics tracked: `rating` (out of 5.0), `completedJobsCount`, `earnings` total, `pendingPayout`.

3. **Atomic Job Claiming**:
   - Workers view real-time pending jobs sorted by distance and rating matching scores.
   - Click **Claim Job** to claim an offer atomically via Firestore transaction.
