# PickPal Home Services Guide

## Overview of Home Services

Home Services on PickPal are on-demand services where verified delivery partners or skilled technicians travel directly to the customer's specified address.

### Available Doorstep Services
- **Household Repairs & Maintenance**: Electrician, Plumber, Carpenter, Painter, AC Repair, Appliance Repair, Gardening.
- **Home Cleaning**: Full house deep cleaning, kitchen cleaning, bathroom sanitization.
- **Custom Errands & Shopping Runs**: Instant grocery purchasing, emergency medicine pick-up, retail errands, local parcel pick & drop.

### Booking Flow for Home Services

1. **Service Selection or Custom Request**:
   - Customers can browse by category on the PickPal Home dashboard or click **+ New Request** for custom errands.
   - For custom shopping, customers enter item names, quantities, preferred store names, and a budget limit (`budgetCap`).
   - Customers can attach voice notes, photos of shopping lists, or instructions.

2. **Location Selection**:
   - Customers select their delivery location using an interactive Leaflet map pin or saved addresses.
   - The system records exact GPS coordinates (`customerLat`, `customerLng`).

3. **Worker Assignment & Dispatch Algorithm**:
   - When a request is created, it enters the status `searching_worker`.
   - PickPal's distance and rating scoring algorithm broadcasts the job offer feed to nearby active workers who are **Online** and within their configured operating radius.
   - The first eligible worker to claim the job is assigned atomically in Firestore to prevent duplicate worker claims.

4. **Order Progress & Navigation**:
   - Once assigned, the order transitions through status steps:
     1. `worker_assigned`: Worker claimed job.
     2. `travelling`: Worker traveling to shop/customer.
     3. `arrived`: Worker arrived at store or customer doorstep.
     4. `in_progress` / `checkout_approvals`: Worker purchasing items or performing repair.
     5. `delivering`: Worker en route to doorstep with items.
     6. `completed`: Order delivered and finalized.

5. **Real-Time Live Map Tracking**:
   - Customers can open the **Track** screen to view live Leaflet map navigation.
   - Workers stream real-time location coordinates (`workerLiveLat`, `workerLiveLng`, `workerLiveAt`).
   - The UI calculates and displays a dynamic estimated time of arrival (ETA counter) and turn-by-turn route path.

6. **In-App Communication & AI Substitutions**:
   - Customers and workers communicate via real-time in-app chat (`/messages`).
   - If a requested item is out of stock, the worker can propose a substitute with price adjustment.
   - Integrated Google Gemini AI suggests store-brand or budget-friendly product alternatives to assist shoppers.
