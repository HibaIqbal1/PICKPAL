# PickPal Salon Token Queue System Guide

## Overview of Salon Tokens

The PickPal Digital Salon Token System allows customers to join virtual waiting queues for local salons, barber shops, spas, and clinics without physically standing in line at the venue.

### Token Generation & Structure
- Upon booking a queue spot at a shop, PickPal generates an appointment token document in Firestore (`/appointments/{appointmentId}`).
- Each token features a sequential queue identifier such as `Q-18` (where `18` represents the token sequence number for the shop on that date).
- Associated record fields include: `shopId`, `shopName`, `serviceName`, `staffName`, `date`, `timeSlot`, `queueNumber`, `otp`, `status` (`confirmed`, `in_progress`, `completed`, `cancelled`).

### Live Queue Tracking & Math
The customer's `AppointmentToken` view subscribes in real time to the shop's live queue state (`ShopService.subscribeQueueState` listening to `/shop_queues/{shopId}_{date}`):

1. **Current Serving Token (`currentRunningToken`)**:
   - Displays the token currently inside the service chair (e.g., `Q-12`).

2. **People Ahead (`peopleAhead`)**:
   - Calculated dynamically as:
     $$\text{peopleAhead} = \max(0, \text{myTokenNum} - \text{currentRunningToken})$$
   - Example: If your token is `Q-18` and current serving is `Q-12`, there are $18 - 12 = 6$ people ahead of you.

3. **Estimated Wait Time Calculation (`waitTime`)**:
   - PickPal uses a standard formula of **20 minutes per person ahead**:
     $$\text{Est. Wait Time (mins)} = \text{peopleAhead} \times 20$$
   - Example: For 6 people ahead, estimated wait time is $6 \times 20 = 120\text{ minutes}$.
   - If token status is `completed`, wait time displays `"Served"`.
   - If token status is `cancelled`, wait time displays `"Cancelled"`.

### Check-In Verification & Arrival at Shop
- **QR Code & Verification OTP**: Each token contains a unique Check-In Verification Code (OTP) and a scannable digital QR code.
- **Shop Navigation**: Customers can click "Navigate to Shop" to open Google Maps directions to the shop location.
- **Scan at Shop**: Upon arrival at the salon, shop staff scan the customer's QR code or verify the OTP to mark the appointment as `in_progress`.

### Queue Updates & Ticket Cancellation
- As shop staff complete appointments, the `currentRunningToken` increments, automatically reducing the `peopleAhead` count and estimated wait time on all waiting customers' mobile screens.
- Customers can cancel their queue spot at any time prior to check-in by clicking **Cancel Ticket**, freeing up the queue for others.
