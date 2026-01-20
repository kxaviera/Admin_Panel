# 🚀 Quick Start Guide

Get your Pikkar Admin Dashboard up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Backend API running (http://localhost:5000)
- ✅ Admin user created in database

## Step 1: Install Dependencies (2 minutes)

```bash
cd admin-dashboard
npm install
```

This will install all required packages including Next.js, React, TypeScript, and UI components.

## Step 2: Configure Environment (1 minute)

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Step 3: Run Development Server (1 minute)

```bash
npm run dev
```

✅ Dashboard will open at: **http://localhost:3001**

## Step 4: Login (1 minute)

1. Open http://localhost:3001 in your browser
2. You'll be redirected to the login page
3. Enter your admin credentials:
   - Email: Your admin email
   - Password: Your admin password
4. Click "Sign In"

✅ You're in! Welcome to your admin dashboard.

## 🎯 What Can You Do Now?

### Explore the Dashboard
- **Overview**: See real-time statistics, charts, and recent activity
- **Users**: Manage all platform users
- **Drivers**: Verify and manage drivers
- **Subscriptions**: Create and manage subscription plans
- **Rides**: Monitor all rides in real-time
- **Payments**: Track all transactions
- **Promo Codes**: Create marketing campaigns
- **Analytics**: View detailed insights and reports
- **Settings**: Configure your preferences

### Common Tasks

#### 1. Verify a Driver
```
1. Go to "Drivers" from sidebar
2. Find pending driver
3. Click approve (✓) or reject (✗)
4. Done!
```

#### 2. Create a Subscription Plan
```
1. Go to "Subscriptions"
2. Click "Create Plan"
3. Fill in details (name, duration, price, features)
4. Click "Create Plan"
5. Plan is now available for drivers!
```

#### 3. Create a Promo Code
```
1. Go to "Promo Codes"
2. Click "Create Promo Code"
3. Set code, discount, limits, and validity
4. Click "Create Promo Code"
5. Users can now use it!
```

#### 4. Monitor Rides
```
1. Go to "Rides"
2. See all rides in real-time
3. Filter by status (pending, active, completed)
4. Click on any ride to see details
```

#### 5. View Analytics
```
1. Go to "Analytics"
2. Select time period (7d, 30d, 90d)
3. View revenue, rides, and driver performance
4. Export reports if needed
```

## 📱 Navigation

### Sidebar Menu
- **Dashboard**: Overview and statistics
- **Users**: User management
- **Drivers**: Driver management
- **Rides**: Ride monitoring
- **Subscriptions**: Subscription management
- **Payments**: Payment tracking
- **Promo Codes**: Marketing campaigns
- **Analytics**: Reports and insights
- **Settings**: Configuration

### Top Bar
- **Search**: Quick search across the platform
- **Notifications**: Bell icon for alerts
- **Profile**: Your admin profile

## 🎨 UI Features

### Tables
- **Search**: Use search bar to find items
- **Sort**: Click column headers to sort
- **Filter**: Use filter buttons
- **Pagination**: Navigate through pages
- **Actions**: Click action buttons (eye icon, edit, delete)

### Charts
- **Interactive**: Hover to see details
- **Period Selection**: Change time periods
- **Export**: Download chart data

### Forms
- **Validation**: Real-time validation
- **Required Fields**: Marked with *
- **Success/Error**: Toast notifications

## 🔧 Troubleshooting

### Can't Login?
- ✅ Check if backend is running (http://localhost:5000)
- ✅ Verify admin user exists in database
- ✅ Ensure user role is "admin"
- ✅ Check console for errors

### API Not Working?
- ✅ Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- ✅ Check backend CORS settings
- ✅ Ensure backend accepts requests from localhost:3001

### Page Not Loading?
- ✅ Clear browser cache
- ✅ Restart dev server (Ctrl+C, then `npm run dev`)
- ✅ Check console for JavaScript errors

### Data Not Showing?
- ✅ Ensure backend database has data
- ✅ Check API responses in Network tab
- ✅ Verify authentication token is valid

## 🚀 Production Deployment

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
# Set environment variables in Vercel dashboard
```

### Build for Production

```bash
# Build the app
npm run build

# Test production build locally
npm start

# Deploy to your server
```

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Feature List**: See `FEATURES.md`
- **Complete Status**: See `ADMIN_DASHBOARD_COMPLETE.md`

## 💡 Pro Tips

1. **Use Search**: Quick search in header to find anything
2. **Keyboard Shortcuts**: Navigate faster
3. **Export Data**: Download CSV/Excel reports
4. **Real-time Updates**: Data refreshes automatically
5. **Mobile Friendly**: Access from any device

## 🎉 You're Ready!

Your Pikkar Admin Dashboard is ready to use. Start managing your ride-sharing platform efficiently!

### Need Help?
- Check documentation files
- Review API responses in browser console
- Verify backend is running correctly
- Ensure admin account is properly configured

### Next Steps
- Customize branding and colors
- Add more subscription plans
- Create promotional campaigns
- Monitor platform growth
- Analyze user behavior

**Happy Managing! 🚗💨**

