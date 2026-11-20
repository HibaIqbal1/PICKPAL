# PickPal Safety & Emergency Features Guide

## PickPal Emergency Safety Infrastructure

Customer and worker safety is a top priority on the PickPal platform. PickPal includes a one-tap Emergency SOS escalation system integrated with platform control room administrators.

### One-Tap Emergency SOS Signal

1. **SOS Trigger Interface**:
   - Prominently accessible on customer active order tracking screens, worker job screens, and top navigation bars.
   - Designed for instant activation during emergencies, harassment, accidents, or safety threats.

2. **Data Broadcast Payload**:
   - Clicking the Emergency SOS button immediately captures real-time telemetry:
     - `userId`: Authenticated user UID.
     - `userName`: Full name of user broadcasting alert.
     - `role`: User role (`customer` or `worker`).
     - `orderId`: Active order ID (if SOS is triggered during an order).
     - `lat`, `lng`: Live GPS latitude and longitude coordinates.
     - `reason`: Primary safety incident category.
     - `note`: Optional emergency description.
     - `status`: Set to `"open"`.
     - `createdAt`: ISO timestamp.

3. **Firestore Event Dispatch**:
   - Pushes an emergency record directly into the `/sos_events/{sosId}` collection in Cloud Firestore.

4. **Control Room Monitoring & Admin Alerting**:
   - Platform Administrators monitoring the **Control Room Portal** (`ControlDashboard.tsx`, `ControlSidebar.tsx`) receive real-time visual and audible emergency alerts.
   - Admins can inspect the broadcast coordinates on an interactive emergency map, contact local authorities, call emergency services, and mark the event as `resolved`.

### Security & Privacy Protections
- All user data and location broadcasts are encrypted and restricted by Firestore Security Rules (`firestore.rules`).
- SOS events can only be created by authenticated users and resolved by validated platform administrators.
