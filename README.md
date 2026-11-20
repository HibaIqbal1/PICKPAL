# PickPal

[![React](https://img.shields.io/badge/React-19.0.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.16-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E44AD?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

PickPal is a full-featured, hyperlocal quick-commerce marketplace and on-demand service delivery platform. Inspired by modern instant-delivery services, PickPal connects **Customers**, **Delivery Workers/Partners**, **Local Shop Vendors**, and **Platform Administrators** in real time to facilitate rapid shopping errands, service bookings, worker dispatching, and live order tracking.

---

## 📑 Table of Contents
1. [Overview](#1-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Installation & Setup](#5-installation--setup)
6. [Environment Variables](#6-environment-variables)
7. [Usage](#7-usage)
8. [API Documentation](#8-api-documentation)
9. [Screenshots / Demo](#9-screenshots--demo)
10. [Database](#10-database)
11. [Authentication & Security](#11-authentication--security)
12. [Deployment](#12-deployment)
13. [Troubleshooting](#13-troubleshooting)
14. [Future Improvements](#14-future-improvements)
15. [Contributing](#15-contributing)
16. [License](#16-license)

---

## 1. Overview

In urban environments, consumers frequently require immediate assistance with quick errands, grocery runs, custom retail purchasing, household repairs, or local service appointments. Traditional e-commerce platforms operate on centralized warehousing models that cannot fulfill sub-30-minute delivery demands.

**PickPal** solves this by establishing a decentralized, multi-role ecosystem:
- **Customers** can request custom shopping runs, hire nearby verified workers for errands, or book shop service tokens.
- **Delivery Partners** receive job dispatch notifications, claim orders atomically based on geographic proximity, and stream live location updates.
- **Shop Vendors** list physical products, manage service slots, delegate staff, and fulfill local orders.
- **Admins** oversee platform metrics, audit worker onboarding applications, monitor emergency SOS alerts, and resolve customer disputes.

---

## 2. Features

### ✅ Implemented Features

- 🛒 **Customer Portal**:
  - Custom shopping & errand request creation with item descriptions, budgets, and address pickers.
  - Hyperlocal shop & service browsing by category (Groceries, Electronics, Repairs, Cleaning, Beauty, etc.).
  - Real-time interactive Leaflet map tracking worker location, delivery routes, and dynamic ETA counters.
  - In-app real-time chat with delivery workers featuring automated Google Gemini AI product substitution recommendations.
  - Integrated digital wallet balance management, transaction logs, and appointment token generation.
  - One-tap Emergency SOS escalation button broadcasting live location to platform control room admins.

- 🚚 **Worker / Partner Portal**:
  - Interactive Online/Offline availability toggle with customizable service operating radius.
  - Real-time job offer feed powered by a distance and rating scoring algorithm.
  - Atomic Firestore order claiming to prevent race conditions (no two workers can accept the same job).
  - Turn-by-turn order status navigation (`Accepted` → `Shopping` → `Out for Delivery` → `Completed`).
  - Earnings dashboard and completed task breakdown metrics.

- 🏪 **Shop Vendor Portal**:
  - Storefront profile setup, product catalog, and service package management.
  - Staff delegation for order fulfillment and appointment token handling.
  - Store sales and token appointment analytics.

- 🛡️ **Admin & Control Room Portal**:
  - Platform analytics dashboard showing active orders, online workers, revenue volume, and system health.
  - Worker identity verification and onboarding application auditing.
  - Incident response control room monitoring live emergency SOS signals.
  - Granular Role-Based Access Control (RBAC) enforced via Firestore rules and `/admins/{uid}` document validation.

- 🔒 **Enterprise Security & Rate Limiting**:
  - IP-based rate limiting (10 login requests/minute).
  - Account lockout mechanism (5 failed attempts trigger a 15-minute lock).
  - Progressive artificial delay (0–5 seconds) to counter brute-force attacks.
  - Zod schema validation and server-side API key isolation.

### 🚧 Planned / Incomplete Features

- 📹 **Live Video / Audio Calls**: UI shell and hooks (`useCall.ts`) exist, but WebRTC signaling servers are not fully wired.
- 🔔 **FCM Push Notifications**: Notification UI and hook (`useNotifications.ts`) are implemented, but Firebase Cloud Messaging push triggers are not configured.
- 💳 **Razorpay Live Gateway**: Payment UI modal (`AddMoneyModal.tsx`) and service stub (`payment-gateway.service.ts`) are implemented, but live Razorpay webhooks are not attached.

---

## 3. Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) `v19.0.1`
- **Build Tool & Dev Server**: [Vite](https://vitejs.dev/) `v6.2.3`
- **Language**: [TypeScript](https://www.typescriptlang.org/) `v5.8.2`
- **Routing**: [React Router DOM](https://reactrouter.com/) `v6.24.0`
- **Async State**: [TanStack React Query](https://tanstack.com/query) `v5.51.1`

### Backend
- **Server Runtime**: [Node.js](https://nodejs.org/)
- **Web Framework**: [Express](https://expressjs.com/) `v4.21.2`
- **Admin SDK**: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) `v14.2.0`

### Database & BaaS
- **Database**: [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) `v12.16.0`
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)

### APIs & AI Integration
- **AI Assistant**: [Google Gemini API](https://deepmind.google/technologies/gemini/) (`@google/genai` `v2.4.0` using `gemini-2.0-flash`)
- **Custom Endpoints**: Express REST API (`/api/assistant`, `/login`, `/api/login`)

### Styling & UI Libraries
- **CSS Framework**: [Tailwind CSS](https://tailwindcss.com/) `v4.1.14`
- **Icons**: [Lucide React](https://lucide.dev/) `v0.546.0`
- **Animations**: [Motion](https://motion.dev/) (Framer Motion derivative) `v12.23.24`
- **Mapping Engine**: [Leaflet](https://leafletjs.com/) `v1.9.4` & [React-Leaflet](https://react-leaflet.js.org/) `v5.0.0`

### Hosting & Deployment
- **Static Hosting**: [Firebase Hosting](https://firebase.google.com/docs/hosting) (configured via `firebase.json`)
- **Production Server**: Express Node.js Server (`server.js`)

### Other Dependencies
- **Validation**: [Zod](https://zod.dev/) `v4.4.3`
- **Hashing & Security**: [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js) `v3.0.3`
- **Environment Management**: [Dotenv](https://github.com/motdotla/dotenv) `v17.2.3`
- **Bundler & Script Runners**: [ESBuild](https://esbuild.github.io/) `v0.25.0`, [TSX](https://github.com/privatenumber/tsx) `v4.21.0`

---

## 4. Project Structure

```
gopickpal/
├── backend/                  # Python helper scripts & FastAPI sub-application
│   ├── app/                  # Python backend source files
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Microservice documentation
├── src/
│   ├── app/                  # Route guards & authentication wrappers
│   ├── components/
│   │   ├── admin/            # Admin dashboard widgets & monitoring views
│   │   ├── control/          # Control room & emergency SOS response panels
│   │   ├── shared/           # Shared UI components (LiveMap, ChatPanel, OrderCard, TopBar)
│   │   └── ui/               # Base UI primitives (Button, Skeleton)
│   ├── contexts/             # React Contexts (AuthContext for user state & RBAC)
│   ├── hooks/                # Custom real-time Firestore hooks (useOrders, useMessages, etc.)
│   ├── lib/                  # Utilities (matching.ts, firebase.ts, assistant.ts)
│   ├── middleware/           # Express security middleware (rateLimiter, accountLock, progressiveDelay)
│   ├── pages/
│   │   ├── admin/            # Admin Dashboard page
│   │   ├── customer/         # Customer pages (Home, NewRequest, Track, Orders, Wallet, Profile)
│   │   └── worker/           # Worker pages (Dashboard, Job execution, Onboarding, Earnings)
│   ├── services/             # Modular business service layer (auth, booking, shop, wallet, etc.)
│   ├── styles/               # Index CSS & Tailwind v4 custom theme
│   ├── types/                # Additional module types
│   ├── types.ts              # Global TypeScript interfaces & database schema definitions
│   ├── App.tsx               # Main application routing & layout setup
│   └── main.tsx              # React DOM entry point
├── .env.example              # Environment variables template
├── firebase-applet-config.json # Firebase project metadata
├── firebase-blueprint.json   # Full database schema and index blueprint
├── firebase.json             # Firebase Hosting configuration
├── firestore.rules           # Security Rules for Cloud Firestore
├── index.html                # Vite HTML entry template
├── package.json              # Project dependencies & scripts
├── server.js                 # Production Express server & Gemini AI API proxy
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build setup
```

---

## 5. Installation & Setup

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher (or `bun` / `yarn`)
- A **Firebase Project** with **Firestore Database** and **Firebase Authentication** enabled.

---

### Step 1: Repository Setup

Clone the repository to your local system:

```bash
git clone https://github.com/Kempegowda77/pickpal.git
cd gopickpal
```

---

### Step 2: Dependency Installation

Install all required dependencies:

```bash
npm install
```

---

### Step 3: Environment Variables Setup

Create a `.env` file in the root directory by copying the example file:

```bash
cp .env.example .env
```

Edit the `.env` file and insert your configuration details (see [Environment Variables](#6-environment-variables) below).

---

### Step 4: Database & Firebase Setup

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firebase Authentication** (Email/Password & Phone provider).
3. Create a **Cloud Firestore Database** in Production mode.
4. Deploy the project's security rules to Firestore:
   - Copy the contents of [`firestore.rules`](file:///c:/Users/kempe/OneDrive/文档/Desktop/gocampuX/gopickpal/firestore.rules) into the Rules tab in the Firebase Console and click **Publish**.

---

### Step 5: Running the Local Server

#### Development Mode (Vite Dev Server)

```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.

*Note: In `npm run dev` mode, frontend AI assistant calls will fall back gracefully to a stub suggestion because the Express production backend server (`server.js`) is not active during Vite standalone dev.*

#### Production Mode (Express Server + AI Proxy)

```bash
# Build the production bundle
npm run build

# Start the Express server
node server.js
```

The production server will be accessible at `http://localhost:8080`.

---

## 6. Environment Variables

Environment variables are configured in `.env` for server-side usage. Never commit real keys or secrets to version control.

```env
# Server-side only — used by server.js, never exposed to the browser.
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Port for the Node.js production server (default: 8080)
PORT=8080

# Production Redis / Upstash Cache configuration for rate-limiting & brute-force lockout (Optional)
UPSTASH_REDIS_REST_URL=YOUR_UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN=YOUR_UPSTASH_REDIS_REST_TOKEN
```

### Explanation of Variables:
- `GEMINI_API_KEY`: Google Gemini AI API key used by `server.js` to serve product substitution recommendations.
- `PORT`: Network port for running `server.js`.
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL for distributed rate limiting in multi-instance production environments.
- `UPSTASH_REDIS_REST_TOKEN`: REST authentication token for Upstash Redis.

---

## 7. Usage

### Application Workflows

1. **Customer Workflow**:
   - Register or log in as a customer.
   - On the Home screen, click **+ New Request** to submit a custom errand or grocery run.
   - Specify item descriptions, budget limit, and delivery address.
   - Once submitted, track your assigned worker on the **Live Track** Leaflet map and communicate via real-time chat.

2. **Worker / Partner Workflow**:
   - Register or log in as a worker and complete onboarding.
   - Toggle availability status to **Online**.
   - View nearby pending jobs ranked by distance and matching score.
   - Click **Claim Job** to atomically claim the request.
   - Advance the job through status steps (`Accepted` $\rightarrow$ `Shopping` $\rightarrow$ `Delivering` $\rightarrow$ `Completed`).

3. **Shop Vendor Workflow**:
   - Register a shop profile under vendor options.
   - Create catalog items and service packages.
   - Manage incoming appointment tokens and customer orders.

4. **Admin Workflow**:
   - Create an admin document at `/admins/{YOUR_UID}` in Firestore.
   - Log in to land automatically on `/admin`.
   - Monitor platform metrics, audit worker applications, and respond to SOS alerts.

---

## 8. API Documentation

The production Express server (`server.js`) exposes the following backend API endpoints:

### 1. Shopping Assistant Proxy

- **Endpoint**: `POST /api/assistant`
- **Authentication**: Requires Firebase Bearer ID Token (`Authorization: Bearer <ID_TOKEN>`)
- **Description**: Proxies request to Google Gemini API (`gemini-2.0-flash`) to generate item substitution advice without exposing the `GEMINI_API_KEY` to the client browser.

#### Request Body:
```json
{
  "itemDescription": "Organic Almond Milk 1L",
  "budget": 250
}
```

#### Response (Success - 200 OK):
```json
{
  "suggestion": "Consider offering the 1L Soy Milk or standard Dairy Milk brand priced at ₹180 to stay comfortably within budget."
}
```

#### Response (Fallback/No Key - 200 OK):
```json
{
  "suggestion": "(stub — no GEMINI_API_KEY set) Consider a store-brand alternative to stay under ₹250."
}
```

---

### 2. Enterprise Protected Login

- **Endpoints**: `POST /login` and `POST /api/login`
- **Middleware Pipeline**: `rateLimiter` (10 req/min/IP) $\rightarrow$ `accountLock` (5 failed attempts / 15 min lock) $\rightarrow$ `progressiveDelay` (0–5s artificial delay) $\rightarrow$ Zod Schema Validation $\rightarrow$ Firebase Admin Auth Verification.

#### Request Body (Email Login):
```json
{
  "email": "user@example.com",
  "password": "YourSecurePassword123!"
}
```

#### Response (Success - 200 OK):
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "uid": "abc123xyz",
    "email": "user@example.com",
    "phoneNumber": null,
    "displayName": "John Doe"
  }
}
```

#### Response (Failure - 401 / 400 / 429):
```json
{
  "success": false,
  "message": "Incorrect email or password."
}
```

---

## 9. Screenshots / Demo

> [!NOTE]
> *Screenshots and demo recordings will be added here once available.*

| Customer Home & Discovery | Live Leaflet Tracking | In-App AI Chat | Worker Dashboard |
| :---: | :---: | :---: | :---: |
| *[ Placeholder: Customer UI ]* | *[ Placeholder: Live Map ]* | *[ Placeholder: AI Assistant ]* | *[ Placeholder: Worker UI ]* |

---

## 10. Database

PickPal uses **Firebase Cloud Firestore** as its primary real-time database. The full schema structure is defined in [`firebase-blueprint.json`](file:///c:/Users/kempe/OneDrive/文档/Desktop/gocampuX/gopickpal/firebase-blueprint.json) and mirrored in TypeScript interfaces inside [`src/types.ts`](file:///c:/Users/kempe/OneDrive/文档/Desktop/gocampuX/gopickpal/src/types.ts).

### Important Collections

| Collection Path | Purpose | Key Fields |
| :--- | :--- | :--- |
| `/users/{uid}` | User profiles (Customer/Worker/Vendor/Admin) | `email`, `role`, `name`, `phone`, `rating`, `createdAt` |
| `/admins/{uid}` | Dedicated admin authorization collection | `grantedAt`, `grantedBy`, `role` |
| `/orders/{orderId}` | Errand & service delivery orders | `customerId`, `workerId`, `status`, `items`, `budget`, `location` |
| `/messages/{messageId}` | Live chat messages between customer & worker | `orderId`, `senderId`, `receiverId`, `text`, `timestamp` |
| `/shops/{shopId}` | Local shop profiles & catalog details | `name`, `ownerId`, `category`, `address`, `rating` |
| `/services/{serviceId}`| Shop service packages | `shopId`, `title`, `price`, `duration` |
| `/wallets/{userId}` | User wallet balances & transactions | `balance`, `currency`, `transactions` |
| `/reviews/{reviewId}` | Customer reviews for workers & shops | `targetId`, `authorId`, `rating`, `comment` |
| `/sos_events/{sosId}` | Emergency SOS alert logs | `userId`, `location`, `status`, `triggeredAt` |

### Database Setup & Rules

All collection read/write permissions are strictly governed by [`firestore.rules`](file:///c:/Users/kempe/OneDrive/文档/Desktop/gocampuX/gopickpal/firestore.rules).
- Global default catch-all rule denies unauthenticated read/write access.
- Admin status is verified via `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
- Order updates enforce field immutable constraints so users cannot modify completed orders.

---

## 11. Authentication & Security

### Authentication Flow

1. **Client-Side Auth**: Users sign up or log in via Firebase Authentication (`src/contexts/AuthContext.tsx`). Firebase issues a secure JWT ID Token.
2. **Role-Based Authorization (RBAC)**:
   - Profile state is loaded from Firestore `/users/{uid}`.
   - Admin access is checked by querying `/admins/{uid}`.
3. **Backend Route Protection**:
   - `server.js` validates authorization headers using `admin.auth().verifyIdToken(token)`.
4. **Brute-Force Protection Pipeline**:
   - IP-based rate limiting (10 attempts/min).
   - Account lockout after 5 consecutive failures.
   - Progressive artificial delay up to 5 seconds.
   - Server-side Zod input sanitization.

---

## 12. Deployment

### Static Frontend Deployment (Firebase Hosting)

PickPal is configured for Firebase Hosting via `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

To deploy the static frontend to Firebase Hosting:

```bash
# Build the production bundle
npm run build

# Deploy via Firebase CLI
firebase deploy --only hosting
```

### Production Node.js Server Deployment

To deploy `server.js` (which serves static assets + the `/api/assistant` endpoint):
- Deploy to Node.js environments such as Google Cloud Run, AWS App Runner, Render, or Railway.
- Ensure environment variables (`GEMINI_API_KEY`, `PORT`) are configured in the container runtime settings.

---

## 13. Troubleshooting

### Common Setup & Runtime Issues

#### 1. AI Assistant Returns Stub Response
- **Symptom**: Calling the AI assistant returns `(stub — no GEMINI_API_KEY set)...`.
- **Cause**: You are running in `npm run dev` mode (where `server.js` is not active) or `GEMINI_API_KEY` is missing in `.env`.
- **Solution**: Add your key to `.env`, build the app with `npm run build`, and launch `node server.js`.

#### 2. Admin Portal Redirects to Home / Access Denied
- **Symptom**: Logging in with an admin account redirects away from `/admin`.
- **Cause**: The Firestore document at `/admins/{uid}` does not exist for your user UID.
- **Solution**: Open Firebase Console $\rightarrow$ Firestore $\rightarrow$ Create document at `/admins/{YOUR_USER_UID}`.

#### 3. Firestore Permission Denied
- **Symptom**: Console logs show `FirebaseError: Missing or insufficient permissions`.
- **Cause**: Firestore security rules have not been deployed, or user is unauthenticated.
- **Solution**: Deploy [`firestore.rules`](file:///c:/Users/kempe/OneDrive/文档/Desktop/gocampuX/gopickpal/firestore.rules) in the Firebase Console.

#### 4. Port 8080 or 3000 Already in Use
- **Symptom**: `Error: listen EADDRINUSE: address already in use :::8080`.
- **Solution**: Set `PORT=8081` in `.env` or terminate the process using that port.

---

## 14. Future Improvements

The following improvements are planned for future releases:

- 📹 **Complete WebRTC Signaling**: Connect WebRTC signaling for peer-to-peer live video/audio calls between customers and delivery partners.
- 🔔 **FCM Push Notification Service**: Wire background service workers for real-time order status push alerts.
- 💳 **Razorpay Live Payment Integration**: Connect live Razorpay webhooks for instant wallet top-ups.
- 📍 **Enhanced Route Optimization**: Integrate Google Maps / Mapbox Matrix APIs for multi-stop errand routing.
- ⚡ **Upstash Redis Caching**: Connect production Upstash Redis instance for multi-region rate limiting.

---

## 15. Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request for review.

Please ensure code formatting conforms to TypeScript standards and passes `npm run lint`.

---

## 16. License

No license has currently been specified for this project.
