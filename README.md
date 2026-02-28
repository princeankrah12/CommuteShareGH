# CommuteShare GH

Ghana’s most trusted and dignified carpooling network for professionals.

## Architecture
- **Backend**: Node.js, TypeScript, Express, Prisma (PostgreSQL)
- **Mobile**: Flutter (Android & iOS)

## Getting Started (Docker - Recommended)

To start the backend and database instantly:

```bash
docker-compose up --build
```

This will:
1. Start a PostgreSQL 15 database.
2. Build the Node.js backend.
3. Link them together automatically.

## Local Development (Manual)

### Backend
1. `cd backend`
2. `npm install`
3. Configure `.env` with your `DATABASE_URL`
4. `npx prisma migrate dev`
5. `npm run dev`

### Mobile
1. `cd mobile`
2. `flutter pub get`
3. `flutter run`

## Key Features
- **Trust Architecture**: Ghana Card & Corporate Email verification.
- **Wallet System**: Closed-loop GHS and Commute Points ledger.
- **Real-time**: Live Chat and Map tracking (OpenStreetMap).
- **Safety**: WhatsApp share-to-track and AC mandate.
