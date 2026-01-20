# Pikkar Backend - Quick Setup Guide

This guide will help you set up and run the Pikkar backend API on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** (v5 or higher)
   - Download: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
   - Verify: `mongod --version`

3. **npm** or **yarn**
   - Comes with Node.js
   - Verify: `npm --version`

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd Admin_Panel
npm install
```

This will install all required packages including:
- Express, TypeScript, MongoDB drivers
- Authentication libraries (JWT, bcrypt)
- Real-time features (Socket.IO)
- And more...

### 2. Setup MongoDB

#### Option A: Local MongoDB

1. Start MongoDB service:
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community

   # Windows
   net start MongoDB

   # Linux
   sudo systemctl start mongod
   ```

2. Create database:
   ```bash
   mongosh
   use pikkar
   exit
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/pikkar`)

### 3. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp ENV_TEMPLATE.txt .env
   ```

2. Edit `.env` file with your configuration:

   **Required (Minimum to start):**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/pikkar
   JWT_SECRET=your-secret-key-change-this
   JWT_REFRESH_SECRET=your-refresh-secret-change-this
   ```

   **Optional (for full features):**
   - Stripe keys (for payments)
   - Google Maps API key (for location)
   - Twilio credentials (for SMS)
   - SMTP settings (for emails)

### 4. Create Logs Directory

```bash
mkdir logs
```

### 5. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist` folder.

### 6. Start the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

You should see:
```
Server running in development mode on port 5000
MongoDB Connected: localhost
```

### 7. Test the API

Open your browser or use Postman:
```
http://localhost:5000
```

You should see:
```json
{
  "success": true,
  "message": "Welcome to Pikkar API",
  "version": "v1"
}
```

Test health endpoint:
```
http://localhost:5000/api/v1/health
```

## Quick Test with cURL

### Register a User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "password123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Copy the `accessToken` from the response.

### Get Current User (Protected Route)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Common Issues & Solutions

### Issue 1: MongoDB Connection Failed

**Error:** `MongoServerError: connect ECONNREFUSED`

**Solution:**
- Ensure MongoDB is running: `mongosh` should connect
- Check MONGODB_URI in .env file
- For Atlas, ensure IP is whitelisted

### Issue 2: Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Change PORT in .env to different number (e.g., 5001)
- Or kill the process using port 5000:
  ```bash
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```

### Issue 3: TypeScript Errors

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### Issue 4: Module Not Found

**Solution:**
```bash
npm install
```

## Development Tools

### Recommended VS Code Extensions
- ESLint
- Prettier
- MongoDB for VS Code
- REST Client or Thunder Client

### Testing APIs
- **Postman**: Download at https://www.postman.com/
- **Thunder Client**: VS Code extension
- **Insomnia**: Alternative to Postman

## Project Structure Overview

```
Admin_Panel/
├── src/                  # Source code
│   ├── config/          # Configuration
│   ├── controllers/     # Business logic
│   ├── models/          # Database schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Helper functions
│   ├── app.ts           # Express setup
│   └── server.ts        # Server entry
├── dist/                # Compiled JavaScript
├── logs/                # Application logs
├── .env                 # Environment variables
└── package.json         # Dependencies
```

## Next Steps

1. **Test all endpoints** using Postman or the API documentation
2. **Set up third-party services**:
   - Stripe account for payments
   - Google Maps API for location
   - Twilio for SMS notifications
3. **Review the code** in `src/` to understand the architecture
4. **Start building** your frontend applications
5. **Deploy** to production (Heroku, AWS, DigitalOcean, etc.)

## Getting Help

- Review `README.md` for detailed documentation
- Check `API_DOCUMENTATION.md` for API reference
- Review logs in `logs/` directory for errors
- Check MongoDB logs for database issues

## Production Deployment Checklist

Before deploying to production:

- [ ] Change JWT secrets to strong random strings
- [ ] Set NODE_ENV=production
- [ ] Use production MongoDB (Atlas or managed service)
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set up proper logging
- [ ] Configure payment gateway (Stripe)
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Review security settings

## Resources

- Express.js Docs: https://expressjs.com/
- MongoDB Docs: https://docs.mongodb.com/
- TypeScript Docs: https://www.typescriptlang.org/
- Socket.IO Docs: https://socket.io/docs/
- Stripe Docs: https://stripe.com/docs

Happy Coding! 🚀

