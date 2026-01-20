# 🚀 Pikkar Backend - Quick Start Checklist

Follow this checklist to get your Pikkar backend up and running in **15 minutes**!

---

## ☑️ Step 1: Prerequisites (5 min)

- [ ] **Node.js installed** (v16+)
  ```bash
  node --version
  ```
  If not installed: https://nodejs.org/

- [ ] **MongoDB installed** or MongoDB Atlas account
  ```bash
  mongod --version
  ```
  - Local: https://www.mongodb.com/try/download/community
  - Cloud: https://www.mongodb.com/cloud/atlas (Free tier available)

- [ ] **Git installed** (if cloning from repository)
  ```bash
  git --version
  ```

---

## ☑️ Step 2: Project Setup (3 min)

- [ ] **Navigate to project directory**
  ```bash
  cd Admin_Panel
  ```

- [ ] **Install dependencies**
  ```bash
  npm install
  ```
  ⏱️ This will take 2-3 minutes

---

## ☑️ Step 3: Database Setup (2 min)

### Option A: Local MongoDB

- [ ] **Start MongoDB service**
  ```bash
  # macOS (with Homebrew)
  brew services start mongodb-community
  
  # Windows
  net start MongoDB
  
  # Linux
  sudo systemctl start mongod
  ```

- [ ] **Verify MongoDB is running**
  ```bash
  mongosh
  # Type 'exit' to quit
  ```

### Option B: MongoDB Atlas (Cloud)

- [ ] **Create MongoDB Atlas account** (if not already)
- [ ] **Create a new cluster** (Free M0 tier)
- [ ] **Get connection string**
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/pikkar`
- [ ] **Whitelist your IP address** (or allow access from anywhere for testing)

---

## ☑️ Step 4: Environment Configuration (2 min)

- [ ] **Copy environment template**
  ```bash
  cp ENV_TEMPLATE.txt .env
  ```

- [ ] **Edit .env file** with your configuration

  **Minimum Required Configuration:**
  ```env
  NODE_ENV=development
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/pikkar  # or your Atlas URI
  JWT_SECRET=your-super-secret-key-123456
  JWT_REFRESH_SECRET=your-refresh-secret-key-123456
  ```

  **For Local Development, this is enough to start!**

  **Optional (can add later):**
  - Stripe keys (for payments)
  - Google Maps API (for location features)
  - Twilio (for SMS)
  - SMTP (for emails)

---

## ☑️ Step 5: Build & Start (1 min)

- [ ] **Build TypeScript code**
  ```bash
  npm run build
  ```

- [ ] **Start development server**
  ```bash
  npm run dev
  ```

  You should see:
  ```
  Server running in development mode on port 5000
  MongoDB Connected: localhost (or your Atlas cluster)
  ```

- [ ] **Verify API is running**
  - Open browser: http://localhost:5000
  - Should see: "Welcome to Pikkar API"

- [ ] **Test health endpoint**
  - Open: http://localhost:5000/api/v1/health
  - Should see: `{ "status": "success", "message": "Pikkar API is running" }`

---

## ☑️ Step 6: Test Your First API Call (2 min)

### Register a User

- [ ] **Using cURL:**
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

- [ ] **Or use Postman:**
  1. Import `postman_collection.json`
  2. Run "Register User" request
  3. Copy the `accessToken` from response

### Test Protected Route

- [ ] **Get current user:**
  ```bash
  curl -X GET http://localhost:5000/api/v1/auth/me \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
  ```

---

## ☑️ Step 7: Import Postman Collection (Optional, 1 min)

- [ ] **Open Postman**
- [ ] **Import** → Select `postman_collection.json`
- [ ] **Set environment variable:**
  - Variable: `baseUrl`
  - Value: `http://localhost:5000/api/v1`
- [ ] **Set access token after login:**
  - Variable: `accessToken`
  - Value: (paste token from login response)

---

## ✅ Verification Checklist

Your backend is ready when:

- [x] Server starts without errors
- [x] MongoDB connection successful
- [x] Can register a new user
- [x] Can login and receive JWT token
- [x] Can access protected routes with token
- [x] WebSocket connection works (check console logs)

---

## 🎯 Next Steps

Now that your backend is running:

### 1. **Connect Your Frontend**
   - Update API base URL in your User app
   - Update API base URL in your Driver app
   - Test registration and login

### 2. **Test Complete User Flow**
   - [ ] User registers
   - [ ] User logs in
   - [ ] User requests a ride
   - [ ] Driver registers
   - [ ] Driver goes online
   - [ ] Driver accepts ride
   - [ ] Ride completes
   - [ ] Both parties rate each other

### 3. **Add External Services** (Optional)
   - [ ] Google Maps API for real locations
   - [ ] Stripe for actual payments
   - [ ] Twilio for SMS notifications

### 4. **Development Tools**
   - [ ] Install MongoDB Compass (GUI for MongoDB)
   - [ ] Install VS Code extensions (ESLint, Prettier)
   - [ ] Set up Git hooks (Husky)

---

## 🔍 Troubleshooting

### Issue: "MongoDB connection failed"
**Solution:**
- Ensure MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env`
- For Atlas: Verify IP whitelist and credentials

### Issue: "Port 5000 already in use"
**Solution:**
- Change `PORT` in `.env` to 5001 or another port
- Or kill process: `lsof -ti:5000 | xargs kill -9`

### Issue: "Module not found"
**Solution:**
- Run `npm install` again
- Delete `node_modules` and run `npm install`

### Issue: "TypeScript errors"
**Solution:**
- Run `npm run build` to see specific errors
- Check `tsconfig.json` is present

---

## 📚 Documentation Quick Links

- **API Reference**: `API_DOCUMENTATION.md`
- **Setup Guide**: `SETUP_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`
- **Main README**: `README.md`
- **Completion Summary**: `PHASE_1_COMPLETE.md`

---

## 🎓 Key Commands Reference

```bash
# Development
npm run dev              # Start dev server with auto-reload

# Build
npm run build           # Compile TypeScript to JavaScript

# Production
npm start               # Start production server

# Testing
npm test                # Run tests (when added)

# Linting
npm run lint            # Check code quality
```

---

## 📊 API Endpoints Quick Reference

### Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get profile

### Drivers
- `POST /api/v1/drivers/register` - Register as driver
- `GET /api/v1/drivers/nearby` - Find nearby drivers
- `PUT /api/v1/drivers/location` - Update location
- `PUT /api/v1/drivers/toggle-online` - Go online/offline

### Rides
- `POST /api/v1/rides` - Request ride
- `GET /api/v1/rides` - Get ride history
- `PUT /api/v1/rides/:id/accept` - Accept ride
- `PUT /api/v1/rides/:id/status` - Update ride status
- `PUT /api/v1/rides/:id/rate` - Rate ride

---

## ✨ Success Criteria

You've successfully completed setup when you can:

1. ✅ Start the server without errors
2. ✅ Register a new user
3. ✅ Login and receive JWT token
4. ✅ Make authenticated API calls
5. ✅ See logs in console and logs/ directory
6. ✅ Connect from Postman or your frontend

---

## 🎉 Congratulations!

Your Pikkar backend is now **LIVE** and ready for development!

**Total Setup Time:** ~15 minutes

**What you have:**
- ✅ 30+ API endpoints
- ✅ Real-time WebSocket support
- ✅ Secure authentication
- ✅ Database with geospatial queries
- ✅ Production-ready architecture

**Next:** Start integrating with your User and Driver UIs!

---

**Need Help?**
- Check documentation files
- Review error logs in `logs/` directory
- Test with Postman collection
- Verify environment variables

**Happy Coding! 🚀**

