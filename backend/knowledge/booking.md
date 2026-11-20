# PickPal Booking & Order Management Guide

## How Booking Works on PickPal

PickPal provides a streamlined process for creating customer errand requests, shopping orders, and shop service appointments.

### Creating an Order / Request

1. **Initiating a Request**:
   - Customers log into the PickPal Customer Portal and navigate to **Home** or **Categories**.
   - For custom shopping or errands, customers click **+ New Request**.
   - For pre-configured services, customers select a service card (e.g., Electrician, Plumber, Salon) from the marketplace.

2. **Defining Order Details**:
   - **Items / Services**: Specified with names, quantities (`qty`), and optional price estimates.
   - **Budget Cap (`budgetCap`)**: Set by the customer to constrain maximum spending for custom shopping runs.
   - **Location**: Picked via interactive map or selected from saved customer addresses.
   - **Attachments**: Customers can upload text descriptions, reference images, item photos, or voice notes.

3. **Firestore Order Object Creation**:
   - Orders are saved in Cloud Firestore under `/orders/{orderId}`.
   - Initial order parameters include:
     - `customerId`: Authenticated user UID.
     - `customerName`: Name of requesting customer.
     - `category`: Service category (`grocery`, `pharmacy`, `hardware`, `electronics`, `other`).
     - `status`: Set initially to `"searching_worker"`.
     - `totalAmount`: Initial calculated order subtotal.
     - `paymentStatus`: `"pending"` or `"paid"`.

### Worker Assignment & Order Lifecycle

1. **Worker Matching & Dispatch**:
   - Available online workers receive nearby job notifications.
   - Matching algorithm ranks offers based on proximity distance (in km) and worker rating score.
   - **Atomic Claiming**: A worker clicks **Claim Job**. Firestore transaction ensures only one worker can successfully claim the job record.

2. **Complete Order Status Progression**:
   - `searching_worker`: Order posted; searching for nearby available workers.
   - `worker_assigned`: Worker claimed job; `workerId` and `workerName` attached.
   - `travelling`: Worker traveling to merchant store or customer address.
   - `arrived`: Worker physically arrived at store or customer location.
   - `in_progress`: Worker picking items or performing home service.
   - `checkout_approvals`: Worker submitted final bill items for customer approval if budget changed.
   - `delivering`: Worker out for delivery with items.
   - `completed`: Order delivered, service completed, wallet funds settled.
   - `cancelled`: Order terminated by customer or system prior to completion.

### Order Tracking & Reviews
- Customers track live worker GPS coordinates (`workerLiveLat`, `workerLiveLng`) on the **Track** screen.
- Upon completion, customers can leave a star rating (1–5 stars) and review comment for the worker or shop vendor.
