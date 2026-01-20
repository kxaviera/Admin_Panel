# Real-time End-to-End Test Checklist (Admin + User + Driver)

This checklist is for testing the **full live flow** on an emulator/real device using the backend running locally (or deployed).

## 1) Start Backend (API + Socket)

From repo root:

```bash
npm install
npm run dev
```

Health check:

- `http://localhost:5001/api/v1/health`

If testing from **Android Emulator**, open:

- `http://10.0.2.2:5001/api/v1/health`

## 2) Start Admin Dashboard (Web)

```bash
cd admin-dashboard
npm install
npm run dev
```

Open:

- `http://localhost:3000`

Make sure `NEXT_PUBLIC_API_URL` points to your backend, default is `http://localhost:5001/api/v1`.

## 3) Run User App (Flutter)

Android emulator (recommended):

```bash
flutter run \
  --dart-define=PIKKAR_API_BASE_URL=http://10.0.2.2:5001/api/v1 \
  --dart-define=PIKKAR_SOCKET_URL=http://10.0.2.2:5001
```

Physical device (replace with your laptop LAN IP):

```bash
flutter run \
  --dart-define=PIKKAR_API_BASE_URL=http://192.168.X.X:5001/api/v1 \
  --dart-define=PIKKAR_SOCKET_URL=http://192.168.X.X:5001
```

## 4) Run Driver App (Flutter)

Android emulator:

```bash
flutter run \
  --dart-define=PIKKAR_API_BASE_URL=http://10.0.2.2:5001/api/v1 \
  --dart-define=PIKKAR_SOCKET_URL=http://10.0.2.2:5001
```

Physical device:

```bash
flutter run \
  --dart-define=PIKKAR_API_BASE_URL=http://192.168.X.X:5001/api/v1 \
  --dart-define=PIKKAR_SOCKET_URL=http://192.168.X.X:5001
```

## 5) Ride Flow (Real-time)

- **Driver**
  - Login via Firebase OTP
  - Ensure driver is **approved** in admin (Drivers / Driver Applications)
  - Toggle **On Duty**
- **User**
  - Login via Firebase OTP
  - Book a ride (pickup/drop)
- **Driver**
  - Accept the ride (via socket popup or “available rides” list if your UI uses polling)
  - Start ride: enter **Ride Start OTP** provided to the **user**
  - Update ride statuses (started → completed)

Expected:
- User sees ride accepted details
- Ride start requires OTP server-side (wrong OTP fails)
- Status updates are reflected via polling/sockets

## 6) Parcel Flow (Pickup + Delivery OTPs)

- **User**
  - Open Parcel booking
  - Place a parcel order
  - In tracking screen, confirm you can see:
    - Tracking number
    - Pickup OTP (share with driver at pickup)
    - Delivery OTP (share with driver at delivery)
- **Driver**
  - Open **Parcel Jobs** (drawer)
  - Accept a parcel from “Available Parcels”
  - Enter **Pickup OTP** to confirm pickup
  - Enter **Delivery OTP** to confirm delivery

Expected:
- Parcel is assigned to driver
- Pickup OTP verification is enforced server-side
- Delivery OTP verification is enforced server-side
- User tracking screen updates status until delivered/cancelled

## 7) Admin Verification

On admin dashboard:
- Check **Rides** list updates and fares display correctly (paise → INR)
- Check **Parcels** list loads from backend (no mocked data)

