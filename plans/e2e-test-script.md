# MyCommuteShare End-to-End Test Script (v1.0)

This script guides you through the first full "Professional Carpooling" journey using the simulation layer.

## Pre-Test Checklist
1. [ ] **Backend .env:** `USE_MOCK_DATA=true` is set.
2. [ ] **Prisma Setup:** `npx prisma db push` has been run to ensure the schema matches.
3. [ ] **Terminals Ready:** You will need 4 terminal windows/tabs.

---

## Phase 1: Environment Startup

**Terminal 1: API Simulators (Mock 3rd-Party Services)**
```powershell
cd simulators
npm start
```
*Expected: "Mock API Simulator running on port 4000"*

**Terminal 2: Infrastructure & Backend**
```powershell
cd backend
npm run dev
```
*Expected: "Server is successfully running on port 3001"*

**Terminal 2: Fleet Simulator (E2E Automated Load Tester)**
```powershell
cd backend
npx ts-node scripts/fleet-simulator.ts
```
*Expected: "📦 Provisioning drivers, rides, and Virtual Rider in database..."*

**Terminal 3: Admin Dashboard**
```powershell
cd admin-dashboard
npm run dev
```
*Expected: "Ready on http://localhost:3000"*

---

## Phase 2: The User Journey (Mobile)
**Terminal 4: Mobile App**
```powershell
# First, bridge the connection for the physical device
adb reverse tcp:3001 tcp:3001

cd mobile
flutter run
```

### **Step 1: Identity & Professional Onboarding**
1.  **Login:** Tap "Sign in with Google". (The simulation will bypass Google and log you in as `Kojo Mensah`).
2.  **KYC Verification:** Go to **Profile > Verify Identity**.
    *   Enter Ghana Card: `GHA-111111111-1` (The "Magic Success" ID).
    *   Take a selfie (any photo).
    *   *Result: Instant "Verification Successful" message.*
3.  **Work Email:** Go to **Profile > Verify Work**.
    *   Enter: `kojo@mtn.com.gh`.
    *   *Result: User is automatically added to the "MTN Ghana" Affinity Group.*

### **Step 2: Wallet & Payments**
1.  **Top-up:** Go to **Wallet > Top Up**.
    *   Enter Amount: `4.00`.
    *   Tap "Initialize Payment".
    *   *Result: You'll see a mock Paystack URL. Wait 5 seconds.*
    *   *Verify: A notification/log appears: "[Paystack MOCK] Sending async webhook...". Your balance should update to GHS 4.00.*

### **Step 3: Ride Discovery**
1.  **Live Map:** View the home screen map.
    *   *Verify: You should see 20 driver icons moving along Accra's major corridors (N1, Spintex).*
2.  **Search:** Search for "Accra Mall" in the destination.
    *   *Verify: Autocomplete suggests "Accra Mall, Tetteh Quarshie Interchange".*

---

## Phase 3: The Admin Oversight (Web)
1.  Open `http://localhost:3000` in your browser.
2.  **Dashboard:** Check the "Executive Overview".
    *   *Verify: "Total Users" and "Total Revenue" show mock values.*
3.  **Verifications:** Go to **Verifications** tab.
    *   *Verify: You see a list of dummy verification requests.*
4.  **Live Map:** Go to the **Map** tab.
    *   *Verify: You see the same 20 simulated drivers moving in real-time on the admin map.*

---

## Phase 4: Automated Background Testing (Simulator)
While you test manually, the `fleet-simulator.ts` runs automated E2E cycles in the background:
1. **Automated Bookings:** A "Virtual Rider" continuously searches for moving drivers and books them. Look at the backend terminal to see `💳 [Sim Rider] Successfully BOOKED Ride...` events with Wallet deductions.
2. **Automated Trip Completions:** When virtual drivers get within 100m of their hubs, they trigger `ride_ended` events and mark the trips `COMPLETED` in the database.
3. **Automated SOS & Chat:** Every 45s a simulated emergency SOS triggers. Check the Admin Dashboard to see the flashing red incident alerts. Every 20s, a simulated driver drops a test chat log.

---

## Post-Test Evaluation
- [ ] Did the "Magic ID" successfully trigger the approved state?
- [ ] Did the GHS 4.00 top-up trigger the asynchronous webhook?
- [ ] Are the fleet simulator drivers visible on both Mobile and Admin maps?
- [ ] Did the Automated Virtual Rider successfully deduct Wallet balances in PostgreSQL?
- [ ] Do you see the automated SOS events appearing on the Admin Dashboard?
