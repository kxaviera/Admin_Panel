# Pikkar API Documentation

Base URL: `http://localhost:5001/api/v1`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User

**POST** `/auth/register`

Register a new user or driver.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 1.2 Login

**POST** `/auth/login`

Login with email and password (Admin only).

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

### 1.2.1 Firebase Phone OTP Login (User / Driver)

**POST** `/auth/firebase`

Use **Firebase Phone OTP** in your client (Flutter) to sign in, then exchange the Firebase **ID token** for backend JWTs.

**Client flow (Flutter):**
- Verify phone OTP using Firebase Auth
- Call `currentUser.getIdToken()` to get `idToken`
- Send `idToken` to this endpoint

**Request Body:**
```json
{
  "idToken": "firebase_id_token_here",
  "role": "user"
}
```

Notes:
- `role` can be `"user"` or `"driver"` (never `"admin"`).
- Backend will **create the account** if it doesn't exist (default role: `user` if omitted).
- If the account exists, `role` must match the stored role.

**Response (200):**
```json
{
  "status": "success",
  "message": "Firebase login successful",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "User",
      "lastName": "Firebase",
      "email": null,
      "phone": "9876543210",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### 1.2.2 (Deprecated) Backend SMS OTP Endpoints

These endpoints are deprecated (return `410`) because OTP is handled by Firebase Phone Auth in the client:
- `POST /auth/request-otp`
- `POST /auth/verify-otp`

### 1.3 Get Current User

**GET** `/auth/me`

Get the current authenticated user's profile.

**Headers:** Authorization required

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "role": "user",
      "rating": 4.8,
      "totalRides": 25
    }
  }
}
```

### 1.4 Refresh Token

**POST** `/auth/refresh-token`

Refresh the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Push Notifications (FCM)

These APIs let the **logged-in user/driver** register their FCM token so backend can send push notifications.

### Register device token

**POST** `/notifications/device-token`

**Headers:** Authorization required

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Device token registered"
}
```

### Remove device token

**DELETE** `/notifications/device-token`

**Headers:** Authorization required

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Device token removed"
}
```

### Test push (send to my registered devices)

**POST** `/notifications/test`

**Headers:** Authorization required

**Request Body (optional):**
```json
{
  "title": "Test",
  "body": "Hello"
}
```

---

## Subscriptions (Driver App)

### Get subscription UI data (matches driver subscription screen)

**GET** `/subscriptions/ui`

**Headers:** Authorization required (Driver)

Returns:
- `activePlan` (current active subscription + remaining days + earnings)
- `plans` (Starter Welcome + paid plans with discounts)
- `driver` (registration date + total earnings)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "hasActivePlan": true,
    "activePlan": {
      "subscriptionId": "65a...",
      "planCode": "STARTER_WELCOME",
      "name": "Starter Welcome",
      "durationDays": 30,
      "durationLabel": "30 Days",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T00:00:00.000Z",
      "remainingDays": 25,
      "totalEarningsPaise": 1245050,
      "totalEarnings": 12450.5,
      "ridesCompleted": 12,
      "isTrial": true,
      "discountLabel": "FREE"
    },
    "plans": [
      {
        "code": "QUICK_START",
        "title": "Quick Start",
        "durationDays": 1,
        "pricePaise": 9900,
        "priceDisplay": "₹99",
        "originalPricePaise": 19900,
        "originalPriceDisplay": "₹199",
        "discountLabel": "50% OFF",
        "features": ["0% commission on rides"]
      }
    ],
    "driver": {
      "registrationDate": "2026-01-01T00:00:00.000Z",
      "totalEarningsPaise": 1245050,
      "totalEarnings": 12450.5
    }
  }
}
```

### Get subscription plans (mobile-friendly)

**GET** `/subscriptions/plans`

Returns a **plain JSON array** of active plans (some Flutter screens expect a List response).

### Subscribe to a plan (by planId or planCode)

**POST** `/subscriptions/subscribe`

**Headers:** Authorization required (Driver)

**Request Body:**
```json
{
  "planCode": "POWER_DRIVE",
  "paymentMethod": "wallet"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Subscribed successfully",
  "data": {
    "subscription": {
      "_id": "65a...",
      "status": "active",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T00:00:00.000Z"
    }
  }
}
```

### Legacy aliases used by mobile apps

- **GET** `/subscriptions/active` → same as `/subscriptions/my-subscription`
- **POST** `/subscriptions/cancel` → cancels active subscription (no id required)
- **GET** `/subscriptions/stats` → admin: global stats, driver: self snapshot

### 1.5 Logout

**POST** `/auth/logout`

Logout the current user.

**Headers:** Authorization required

---

## 2. Driver Endpoints

### 2.1 Register as Driver

**POST** `/drivers/register`

Register as a driver (requires authentication).

**Headers:** Authorization required

**Request Body:**
```json
{
  "licenseNumber": "DL1234567890",
  "licenseExpiry": "2026-12-31",
  "vehicleType": "sedan",
  "vehicleModel": "Camry",
  "vehicleMake": "Toyota",
  "vehicleYear": 2022,
  "vehicleColor": "Black",
  "vehicleNumber": "KA01AB1234"
}
```

### 2.2 Get Nearby Drivers

**GET** `/drivers/nearby?longitude=77.5946&latitude=12.9716&maxDistance=5000&vehicleType=sedan`

Get drivers near a location.

**Query Parameters:**
- `longitude` (required): Longitude coordinate
- `latitude` (required): Latitude coordinate
- `maxDistance` (optional): Maximum distance in meters (default: 5000)
- `vehicleType` (optional): Filter by vehicle type

**Response (200):**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "drivers": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "userId": {
          "firstName": "Mike",
          "lastName": "Driver",
          "profilePicture": "...",
          "rating": 4.9
        },
        "vehicleType": "sedan",
        "vehicleModel": "Camry",
        "vehicleMake": "Toyota",
        "vehicleNumber": "KA01AB1234",
        "currentLocation": {
          "type": "Point",
          "coordinates": [77.5946, 12.9716]
        },
        "isOnline": true,
        "isAvailable": true,
        "rating": 4.9
      }
    ]
  }
}
```

### 2.3 Update Driver Location

**PUT** `/drivers/location`

Update driver's current location (Driver only).

**Headers:** Authorization required

**Request Body:**
```json
{
  "longitude": 77.5946,
  "latitude": 12.9716
}
```

### 2.4 Toggle Online Status

**PUT** `/drivers/toggle-online`

Toggle driver's online/offline status (Driver only).

**Headers:** Authorization required

**Response (200):**
```json
{
  "status": "success",
  "message": "Driver is now online",
  "data": {
    "isOnline": true
  }
}
```

### 2.5 Verify Driver (Admin)

**PUT** `/drivers/:id/verify`

Approve or reject a driver application (Admin only).

**Headers:** Authorization required (Admin)

**Request Body:**
```json
{
  "status": "approved"
}
```

---

## 3. Ride Endpoints

### 3.1 Request a Ride

**POST** `/rides`

Request a new ride.

**Headers:** Authorization required

**Request Body:**
```json
{
  "pickupLocation": {
    "coordinates": [77.5946, 12.9716],
    "address": "123 Main St, Bangalore, India"
  },
  "dropoffLocation": {
    "coordinates": [77.6101, 12.9800],
    "address": "456 Park Ave, Bangalore, India"
  },
  "vehicleType": "sedan",
  "paymentMethod": "card",
  "scheduledTime": null
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Ride requested successfully",
  "data": {
    "ride": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "userId": "64f1a2b3c4d5e6f7g8h9i0j2",
      "pickupLocation": { ... },
      "dropoffLocation": { ... },
      "vehicleType": "sedan",
      "status": "requested",
      "estimatedFare": 15000,
      "distance": 8.5,
      "otp": "1234"
    }
  }
}
```

### 3.2 Get All Rides

**GET** `/rides?page=1&limit=10&status=completed`

Get all rides (filtered by user role).

**Headers:** Authorization required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by ride status

**Response (200):**
```json
{
  "status": "success",
  "results": 10,
  "data": {
    "rides": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 3.2.1 Get Available Rides (Driver)

**GET** `/rides/available?latitude=12.9716&longitude=77.5946&radiusKm=5`

Driver-only endpoint to fetch nearby ride requests that are still in `requested` status.

**Headers:** Authorization required (Driver)

**Response (200):**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "rides": [ ... ]
  }
}
```

### 3.3 Accept Ride (Driver)

**PUT** `/rides/:id/accept`

Accept a ride request (Driver only).

**Headers:** Authorization required (Driver)

**Response (200):**
```json
{
  "status": "success",
  "message": "Ride accepted successfully",
  "data": {
    "ride": { ... }
  }
}
```

### 3.4 Update Ride Status (Driver)

**PUT** `/rides/:id/status`

Update ride status: arrived, started, or completed (Driver only).

**Headers:** Authorization required (Driver)

**Request Body:**
```json
{
  "status": "started",
  "otp": "1234"
}
```

Notes:
- `otp` is **required** when `status` is `"started"` (user shares OTP with driver).

### 3.5 Cancel Ride

**PUT** `/rides/:id/cancel`

Cancel a ride.

**Headers:** Authorization required

**Request Body:**
```json
{
  "reason": "Changed plans"
}
```

### 3.6 Rate Ride

**PUT** `/rides/:id/rate`

Rate a completed ride.

**Headers:** Authorization required

**Request Body:**
```json
{
  "rating": 5,
  "review": "Great driver, smooth ride!"
}
```

---

## 4. Admin Endpoints

### 4.1 Get User Statistics

**GET** `/users/stats`

Get user statistics (Admin only).

**Headers:** Authorization required (Admin)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "totalUsers": 1250,
    "totalDrivers": 450,
    "totalRiders": 800,
    "stats": [ ... ]
  }
}
```

### 4.2 Get Driver Statistics

**GET** `/drivers/stats`

Get driver statistics (Admin only).

**Headers:** Authorization required (Admin)

### 4.3 Get Ride Statistics

**GET** `/rides/stats`

Get ride statistics (Admin only).

**Headers:** Authorization required (Admin)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "totalRides": 5000,
    "completedRides": 4200,
    "cancelledRides": 300,
    "activeRides": 50,
    "revenue": {
      "totalRevenue": 5000000,
      "avgFare": 12000
    },
    "vehicleTypeStats": [ ... ]
  }
}
```

---

## 5. Parcel Delivery Endpoints

### 5.1 Create Parcel Order (User)

**POST** `/parcels`

Create a parcel delivery order. Backend generates:
- `trackingNumber`
- `pickupOtp` (for sender)
- `deliveryOtp` (for recipient)

**Headers:** Authorization required (User)

**Request Body:**
```json
{
  "pickupLocation": { "coordinates": [77.5946, 12.9716], "address": "Pickup address" },
  "dropoffLocation": { "coordinates": [77.6101, 12.98], "address": "Dropoff address" },
  "parcelDetails": {
    "weight": 2.5,
    "dimensions": { "length": 30, "width": 20, "height": 10 },
    "description": "Documents",
    "category": "documents",
    "value": 500
  },
  "senderInfo": { "name": "Sender", "phone": "9876543210" },
  "recipientInfo": { "name": "Recipient", "phone": "9876500000" },
  "fare": 12000,
  "paymentMethod": "cash",
  "scheduledPickup": null,
  "notes": "Handle with care"
}
```

### 5.2 List Parcels (Role scoped)

**GET** `/parcels?page=1&limit=20&status=pending`

- User: sees own parcels
- Driver: sees assigned parcels
- Admin: sees all parcels

### 5.3 Available Parcels (Driver)

**GET** `/parcels/available?latitude=12.9716&longitude=77.5946&radiusKm=5`

Driver-only endpoint to fetch nearby parcel orders with `status=pending`.

### 5.4 Accept Parcel (Driver)

**PUT** `/parcels/:id/accept`

Assigns the parcel to the driver and changes status to `assigned`.

### 5.5 Pickup Parcel (Driver, Pickup OTP)

**PUT** `/parcels/:id/pickup`

**Request Body:**
```json
{ "otp": "1234" }
```

### 5.6 Mark In Transit (Driver)

**PUT** `/parcels/:id/in-transit`

### 5.7 Deliver Parcel (Driver, Delivery OTP)

**PUT** `/parcels/:id/deliver`

**Request Body:**
```json
{ "otp": "5678", "signature": "optional-base64-or-url" }
```

### 5.8 Cancel Parcel (User/Driver/Admin)

**PUT** `/parcels/:id/cancel`

**Request Body:**
```json
{ "reason": "Changed plans" }
```

### 5.9 Rate Parcel Delivery (User)

**POST** `/parcels/:id/rate`

**Request Body:**
```json
{ "rating": 5, "review": "Fast delivery" }
```

---

## Error Responses

All errors follow this format:

```json
{
  "status": "fail",
  "message": "Error message here"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## WebSocket Events

### Client to Server

- `join` - Join a room
- `driver:location` - Update driver location
- `ride:request` - Broadcast ride request
- `ride:accepted` - Notify ride acceptance
- `ride:status` - Update ride status

### Server to Client

- `driver:location:update` - Driver location updated
- `ride:new` - New ride request (to drivers)
- `ride:accepted` - Ride accepted (to user)
- `ride:status:update` - Ride status updated

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- 100 requests per 15 minutes per IP

## Pagination

All list endpoints support pagination:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

## Date Format

All dates are in ISO 8601 format: `2024-01-05T10:30:00.000Z`

## Coordinates Format

All coordinates use [longitude, latitude] format (GeoJSON standard).

