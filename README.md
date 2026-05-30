# MyCommuteShare (Ghana) 🇬🇭
### Ghana’s Most Trusted Carpooling Network for Professionals

MyCommuteShare is a high-trust, professional carpooling and commute-rotation ecosystem designed for the Ghanaian market. It connects verified professionals (MTN, PwC, Standard Chartered, etc.) to share daily commutes safely, reduce traffic congestion in Accra, and optimize travel costs.

---

## 🏗 Project Architecture & Tech Stack

The project is built as a **monorepo** consisting of three main components:

### 1. Backend (The Engine) - `/backend`
*   **Runtime:** Node.js with TypeScript & Express.
*   **Database:** PostgreSQL with **PostGIS** (for geospatial intelligence).
*   **ORM:** Prisma (Type-safe database access).
*   **Real-time:** Socket.IO (for live driver tracking).
*   **Caching/Spatial Indexing:** Redis (using `GEOADD` for rapid proximity search) and **Uber H3** (hexagonal grid system).
*   **KYC:** Smile Identity (Biometric Ghana Card verification).
*   **Payments:** Paystack (MoMo & Card payments).

### 2. Mobile App (The User Experience) - `/mobile`
*   **Framework:** Flutter (Dart).
*   **State Management:** Provider.
*   **Maps:** `flutter_map` (OpenStreetMap) with custom markers.
*   **Auth:** Firebase Auth + Google One-Tap.
*   **Notifications:** Firebase Cloud Messaging (FCM).

### 3. Admin Dashboard (The Oversight) - `/admin-dashboard`
*   **Framework:** Next.js (React) + TailwindCSS.
*   **Logic:** Executive KPIs, KYC Approval queues, and Real-time Fleet Monitoring.

---

## 📂 Core Directory Structure & Connections

### Data Flow Overview
1.  **User Onboarding:** Mobile app (`/mobile/lib/screens/verification_screen.dart`) captures a photo of the **Ghana Card** and a **Selfie**.
2.  **Identity Verification:** The backend (`/backend/src/services/AuthService.ts`) receives the images and triggers the `IdentityService`.
3.  **Simulation Layer:** To allow testing without real data, `IdentityService.ts` uses "Magic IDs" (e.g., `GHA-111111111-1`) to simulate different KYC outcomes.
4.  **Carpool Matching:** The `MatchmakerService.ts` uses **H3 Hexagonal Indexing** to cluster users who live and work in the same areas (e.g., East Legon to Airport City) at the same time.
5.  **Live Tracking:** Drivers emit their location via WebSockets. The `LocationService.ts` stores these in Redis using `GEOADD`. Riders see these icons move in real-time.

---

## 🚀 The Simulation Layer (E2E Testing)

We have built a "Believable Simulation" layer so you can test the entire app without spending money on APIs or having a real Ghana Card.

### **Identity (SmileID)**
*   **Scenario:** Use `GHA-111111111-1` for instant **Success**.
*   **Scenario:** Use `GHA-222222222-2` for a **Biometric Mismatch**.
*   **Logic:** Located in `backend/src/utils/IdentityService.ts`.

### **Payments (Paystack & MoMo)**
*   **Scenario:** Top-up **GHS 1.00** for instant success.
*   **Scenario:** Top-up **GHS 4.00** to test the **Asynchronous Webhook** (waits 5 seconds then updates balance in background).
*   **Logic:** Located in `backend/src/utils/PaystackService.ts`.

### **Maps & Fleet**
*   **Scenario:** 20 virtual drivers move along Independence Ave and N1.
*   **Logic:** Driven by `backend/scripts/fleet-simulator.ts`.

---

## 🛠 Why These Decisions Were Made

1.  **Why PostGIS & Redis GEO?**
    Ghanaian addresses are often descriptive. By using coordinate-based spatial indexing, we can find drivers "near" a user even if the digital address is imprecise.
2.  **Why H3 Hexagons?**
    Standard geohashes (squares) have "edge" issues where two points 1 meter apart might be in different grids. Hexagons (H3) have uniform distances between centers, making carpool "Pod" clustering more accurate.
3.  **Why "Commute Points" (CP)?**
    To avoid the complexity of GHS 0.01 transactions, we use a point-based system (1 CP = 1 GHS). This allows for "Commute Debt" where professionals can still ride even if their balance is slightly low, maintaining trust.
4.  **Why Professional Affinity Groups?**
    Trust is the biggest barrier to carpooling in Ghana. By restricting pods to verified employees of known companies, we create an automatic "high-trust" environment.

---

## 🏁 How to Run the Project

Follow the **End-to-End Test Script** located in `plans/e2e-test-script.md` for a step-by-step guide to firing up all 4 terminals and running your first carpool test.

---

**Built for the future of Ghanaian mobility.** 🚗🇬🇭
