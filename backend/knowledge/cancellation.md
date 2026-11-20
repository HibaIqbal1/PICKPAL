# PickPal Cancellation Policy Guide

## Cancellation Rules & Policies

PickPal implements cancellation rules for errand orders and salon appointment tokens based on order status and progress.

### 1. Errand & Shopping Order Cancellations
- **Allowed States**: Customers can cancel an order when it is in the `searching_worker` or `worker_assigned` state prior to the worker arriving at the store or starting the service.
- **Cancellation Execution**:
  - The order status in Firestore updates to `cancelled`.
  - If the order was pre-paid via wallet balance, a refund transaction (`type: "credit"`, `description: "Refund for cancelled order"`) is issued to the customer's wallet.
- **Post-In Progress Restrictions**: Once an order moves to `in_progress` (worker is actively purchasing items or performing doorstep repair), cancellation via the app is restricted to protect worker effort and purchased goods.

### 2. Salon Appointment Token Cancellations
- **Allowed States**: Customers holding a confirmed salon or shop service queue token (`Q-18`) can cancel their queue spot at any time prior to shop check-in.
- **Cancellation Execution**:
  - Customer opens their digital ticket (`AppointmentToken.tsx`) and clicks **Cancel Ticket**.
  - Confirms prompt: *"Are you sure you want to cancel this appointment queue spot?"*.
  - Calls `ShopService.cancelAppointment(appointment.id)`, updating appointment status to `cancelled`.
  - The live shop queue recalculates; `peopleWaiting` decrements, reducing wait times for remaining queued customers.

### 3. Refunds for Cancelled Bookings
- Refunds for cancelled bookings are credited directly back to the customer's PickPal Digital Wallet balance (`/wallets/{userId}`).
- Refund transaction records display `status: "success"` and reference the cancelled order ID.
