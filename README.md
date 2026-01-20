# Pikkar - Ride Sharing Backend API

A comprehensive backend API for the Pikkar ride-sharing application built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

### Phase 1 - Core Infrastructure (✅ Completed)

- **User Management**
  - User registration and authentication
  - JWT-based authentication
  - Role-based access control (User, Driver, Admin)
  - Profile management
  - Email and phone verification

- **Driver Management**
  - Driver registration and verification
  - Vehicle information management
  - Real-time location tracking
  - Online/offline status
  - Driver ratings and statistics

- **Ride Management**
  - Ride request and matching
  - Real-time ride tracking
  - Ride status updates
  - Fare calculation
  - Ride history
  - Ratings and reviews

- **Payment System**
  - Multiple payment methods (Cash, Card, Wallet, UPI)
  - Stripe integration
  - Payment tracking
  - Refund management

- **Real-time Features**
  - Socket.IO for real-time updates
  - Live location tracking
  - Ride status notifications
  - Driver availability updates

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Payment**: Stripe
- **Validation**: Express-validator
- **Logging**: Winston
- **Security**: Helmet, CORS, bcrypt

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn
- Stripe account (for payments)
- Google Maps API key (for location services)
- Twilio account (for SMS notifications)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd Admin_Panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   - Copy `.env.example` to create your `.env` file
   - Update the environment variables with your configuration

4. **Create logs directory**
   ```bash
   mkdir logs
   ```

## 🚦 Running the Application

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

## 📁 Project Structure

```
Admin_Panel/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── env.ts       # Environment variables
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── driver.controller.ts
│   │   └── ride.controller.ts
│   ├── models/          # Database models
│   │   ├── User.model.ts
│   │   ├── Driver.model.ts
│   │   ├── Ride.model.ts
│   │   └── Payment.model.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── driver.routes.ts
│   │   └── ride.routes.ts
│   ├── middleware/      # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── utils/           # Utility functions
│   │   ├── logger.ts
│   │   ├── jwt.ts
│   │   ├── AppError.ts
│   │   ├── asyncHandler.ts
│   │   └── fareCalculator.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── logs/                # Application logs
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/update-password` - Update password

### Users
- `GET /api/v1/users` - Get all users (Admin)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin)
- `GET /api/v1/users/stats` - Get user statistics (Admin)

### Drivers
- `POST /api/v1/drivers/register` - Register as driver
- `GET /api/v1/drivers` - Get all drivers (Admin)
- `GET /api/v1/drivers/:id` - Get driver by ID
- `GET /api/v1/drivers/me` - Get driver profile
- `PUT /api/v1/drivers/:id` - Update driver profile
- `PUT /api/v1/drivers/location` - Update driver location
- `PUT /api/v1/drivers/toggle-online` - Toggle online status
- `PUT /api/v1/drivers/:id/verify` - Verify driver (Admin)
- `GET /api/v1/drivers/nearby` - Get nearby drivers
- `GET /api/v1/drivers/stats` - Get driver statistics (Admin)

### Rides
- `POST /api/v1/rides` - Request a ride
- `GET /api/v1/rides` - Get all rides
- `GET /api/v1/rides/:id` - Get ride by ID
- `PUT /api/v1/rides/:id/accept` - Accept ride (Driver)
- `PUT /api/v1/rides/:id/status` - Update ride status (Driver)
- `PUT /api/v1/rides/:id/cancel` - Cancel ride
- `PUT /api/v1/rides/:id/rate` - Rate ride
- `GET /api/v1/rides/stats` - Get ride statistics (Admin)

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## 🌍 Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `STRIPE_SECRET_KEY` - Stripe secret key
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID

## 📊 Database Schema

### User Model
- User information (name, email, phone, password)
- Role (user, driver, admin)
- Verification status
- Profile details
- Ratings and ride history

### Driver Model
- Driver-specific information
- Vehicle details
- License and documents
- Location tracking
- Availability status
- Performance metrics

### Ride Model
- Pickup and dropoff locations
- Ride status
- Fare breakdown
- Payment information
- Ratings and reviews
- Timestamps for each status

### Payment Model
- Transaction details
- Payment method
- Payment status
- Refund information

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based authorization
- Input validation
- Rate limiting (can be added)
- Helmet.js security headers
- CORS configuration

## 📝 Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error logs
- `combined.log` - All logs

## 🧪 Testing

```bash
npm test
```

## 🚀 Next Steps (Phase 2 & 3)

- [ ] Payment gateway integration (Stripe/Razoray)
- [ ] SMS & Email notification service
- [ ] Push notifications (FCM)
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Promo codes and discounts
- [ ] Surge pricing algorithm
- [ ] Ride scheduling
- [ ] Multi-language support

## 📄 License

MIT

## 👥 Contributors

Pikkar Team

## 📧 Support

For support, email support@pikkar.in

