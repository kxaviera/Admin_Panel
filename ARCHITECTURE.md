# Pikkar Backend Architecture

## System Overview

The Pikkar backend is built using a modern, scalable architecture designed to handle real-time ride-sharing operations.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  User App   │  │ Driver App  │  │ Admin Panel │            │
│  │  (React)    │  │  (React)    │  │  (React)    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │     REST API    │    WebSocket    │
          └────────┬────────┴────────┬────────┘
                   │                 │
┌──────────────────┴─────────────────┴─────────────────────────────┐
│                      API GATEWAY LAYER                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Express.js Server (Node.js + TypeScript)                  │  │
│  │  - CORS, Helmet, Compression, Rate Limiting                │  │
│  │  - Request/Response logging                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                      MIDDLEWARE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Auth JWT   │  │  Validation  │  │    Error     │           │
│  │  Middleware  │  │  Middleware  │  │   Handler    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                      ROUTING LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Auth Routes  │  │ User Routes  │  │ Driver Routes│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Ride Routes  │  │ Payment Rts  │  │ Admin Routes │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                    CONTROLLER LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Auth      │  │     User     │  │    Driver    │           │
│  │ Controller   │  │  Controller  │  │  Controller  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │     Ride     │  │   Payment    │  │    Admin     │           │
│  │  Controller  │  │  Controller  │  │  Controller  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                     SERVICE LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Location   │  │  Fare Calc   │  │ Notification │           │
│  │   Service    │  │   Service    │  │   Service    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Matching   │  │   Payment    │  │   Socket.IO  │           │
│  │   Service    │  │   Service    │  │   Service    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                     DATA ACCESS LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  User Model  │  │ Driver Model │  │  Ride Model  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Payment Mdl  │  │ Review Model │  │  Promo Model │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
┌───────────────────────────────┴───────────────────────────────────┐
│                      DATABASE LAYER                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              MongoDB (Mongoose ODM)                         │  │
│  │  - Users Collection    - Rides Collection                   │  │
│  │  - Drivers Collection  - Payments Collection                │  │
│  │  - Geospatial Indexes  - Text Indexes                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Stripe    │  │ Google Maps  │  │    Twilio    │           │
│  │   (Payment)  │  │  (Location)  │  │    (SMS)     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. API Gateway Layer
- **Express.js Server**: Main HTTP server
- **Socket.IO**: Real-time WebSocket connections
- **Security**: CORS, Helmet, Rate limiting
- **Logging**: Morgan + Winston

### 2. Authentication & Authorization
- **JWT Tokens**: Access & Refresh tokens
- **Role-based Access**: User, Driver, Admin
- **Password Security**: bcrypt hashing
- **Token Refresh**: Automatic token renewal

### 3. Data Models

#### User Model
```typescript
{
  firstName, lastName, email, phone,
  password (hashed), role, isVerified,
  profile, address, rating, totalRides
}
```

#### Driver Model
```typescript
{
  userId (ref), licenseInfo, vehicleInfo,
  currentLocation (GeoJSON), isOnline,
  isAvailable, rating, stats, documents
}
```

#### Ride Model
```typescript
{
  userId, driverId, pickupLocation,
  dropoffLocation, status, fare,
  distance, duration, otp, ratings
}
```

### 4. Real-time Features (Socket.IO)

**Events:**
- Driver location updates
- Ride request notifications
- Ride status changes
- Driver availability

### 5. Key Algorithms

#### Fare Calculation
```
baseFare + (distance × perKmRate × vehicleMultiplier)
         + (time × perMinuteRate × vehicleMultiplier)
         + bookingFee
         × surgeMultiplier
         - discounts
```

#### Driver Matching
1. Find drivers within radius (geospatial query)
2. Filter by vehicle type and availability
3. Sort by distance and rating
4. Return top matches

### 6. Database Indexes

**Performance Indexes:**
- User: `email`, `phone`, `role+status`
- Driver: `currentLocation` (2dsphere), `isOnline+isAvailable`
- Ride: `userId`, `driverId`, `status`, `pickupLocation` (2dsphere)

### 7. API Response Format

**Success:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "fail",
  "message": "Error description"
}
```

## Security Measures

1. **Input Validation**: express-validator
2. **SQL Injection**: Mongoose parameterization
3. **XSS Protection**: Helmet.js
4. **CORS**: Whitelisted origins
5. **Rate Limiting**: Prevent abuse
6. **Password Hashing**: bcrypt (10 rounds)
7. **JWT Expiration**: Short-lived tokens

## Scalability Considerations

### Current (Phase 1)
- Single server instance
- MongoDB replica set ready
- Stateless API design

### Future (Phase 2+)
- **Horizontal Scaling**: Multiple API servers
- **Load Balancing**: Nginx/AWS ALB
- **Caching**: Redis for sessions/locations
- **Message Queue**: RabbitMQ for async tasks
- **Microservices**: Separate services for ride, payment, etc.

## Performance Optimizations

1. **Database Indexes**: Geospatial, compound indexes
2. **Compression**: gzip responses
3. **Pagination**: Limit query results
4. **Lean Queries**: Mongoose lean() for read-only
5. **Connection Pooling**: MongoDB connection pool

## Error Handling

**Hierarchy:**
1. Route-level try-catch
2. Async handler wrapper
3. Global error middleware
4. Unhandled rejection handler

## Logging Strategy

**Levels:**
- `error`: System errors, exceptions
- `warn`: Warnings, deprecations
- `info`: Important events
- `debug`: Detailed debugging (dev only)

**Storage:**
- Development: Console + File
- Production: File + External service (future)

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└───────────┬─────────────┬───────────────┘
            │             │
    ┌───────▼──────┐  ┌──▼────────────┐
    │  API Server  │  │  API Server   │
    │   Instance1  │  │   Instance2   │
    └───────┬──────┘  └──┬────────────┘
            │             │
    ┌───────▼─────────────▼────────────┐
    │     MongoDB Replica Set          │
    │  Primary + 2 Secondaries         │
    └──────────────────────────────────┘
```

## API Versioning

Current: `v1` (`/api/v1/...`)

Future versions will be additive, maintaining backward compatibility.

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB |
| ODM | Mongoose |
| Auth | JWT |
| Real-time | Socket.IO |
| Validation | express-validator |
| Logging | Winston |
| Security | Helmet, bcrypt |
| Payments | Stripe |
| Maps | Google Maps API |
| SMS | Twilio |

## Development Principles

1. **Clean Code**: TypeScript for type safety
2. **Separation of Concerns**: MVC pattern
3. **DRY**: Reusable utilities and middleware
4. **Error Handling**: Centralized error handling
5. **Logging**: Comprehensive logging
6. **Security First**: Multiple security layers
7. **Scalable**: Stateless, horizontal scaling ready

---

This architecture supports the current Phase 1 requirements and is designed to scale for future phases.

