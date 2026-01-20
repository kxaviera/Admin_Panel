import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pikkar',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // OTP
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
  
  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  
  // Email
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  // Google Maps
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  driverAppUrl: process.env.DRIVER_APP_URL || 'http://localhost:3001',

  // Firebase Admin (Auth verification)
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  
  // Fare Configuration (in cents/paise)
  fare: {
    baseFare: parseInt(process.env.BASE_FARE || '5000', 10),
    perKmRate: parseInt(process.env.PER_KM_RATE || '1000', 10),
    perMinuteRate: parseInt(process.env.PER_MINUTE_RATE || '200', 10),
    minimumFare: parseInt(process.env.MINIMUM_FARE || '3000', 10),
    bookingFee: parseInt(process.env.BOOKING_FEE || '500', 10),
    surgeMultiplier: parseFloat(process.env.SURGE_MULTIPLIER || '1.0'),
  },
};

