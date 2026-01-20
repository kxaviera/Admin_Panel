# Pikkar Admin Dashboard

A modern, feature-rich admin dashboard for the Pikkar ride-sharing platform. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Features
- **Dashboard Overview**: Real-time statistics and key metrics
- **User Management**: View, search, and manage all platform users
- **Driver Management**: Verify drivers, view documents, and monitor status
- **Subscription Management**: Create and manage subscription plans for drivers
- **Ride Monitoring**: Track all rides with detailed information
- **Payment Tracking**: Monitor all transactions and payments
- **Promo Code Management**: Create and manage promotional campaigns
- **Analytics & Reports**: Comprehensive analytics with charts and insights
- **Settings**: Configure app settings and admin preferences

### Technical Features
- **Authentication**: Secure JWT-based authentication
- **Real-time Updates**: Socket.IO integration for live data
- **Responsive Design**: Mobile-friendly interface
- **Dark Mode Ready**: Built-in dark mode support
- **Type-Safe**: Full TypeScript implementation
- **State Management**: Zustand for global state
- **API Integration**: Axios with interceptors
- **Data Fetching**: React Query for efficient data management

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🛠️ Installation

1. **Install Dependencies**:
```bash
cd admin-dashboard
npm install
```

2. **Configure Environment**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

3. **Run Development Server**:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── page.tsx      # Overview
│   │   │   ├── users/        # User management
│   │   │   ├── drivers/      # Driver management
│   │   │   ├── rides/        # Ride monitoring
│   │   │   ├── subscriptions/ # Subscription management
│   │   │   ├── payments/     # Payment tracking
│   │   │   ├── promo-codes/  # Promo code management
│   │   │   ├── analytics/    # Analytics & reports
│   │   │   └── settings/     # Settings
│   │   ├── login/            # Login page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components (shadcn/ui)
│   │   ├── layout/           # Layout components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── lib/                   # Utility functions
│   │   ├── api.ts            # API client
│   │   └── utils.ts          # Helper functions
│   ├── store/                 # State management
│   │   └── authStore.ts      # Authentication state
│   └── types/                 # TypeScript types
│       └── index.ts          # Type definitions
├── public/                    # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind config
└── next.config.js            # Next.js config
```

## 🔑 Authentication

The admin dashboard requires admin-level authentication:

1. Login with admin credentials at `/login`
2. Only users with `role: "admin"` can access the dashboard
3. JWT tokens are stored in localStorage
4. Automatic redirect to login if unauthenticated

## 📊 Dashboard Pages

### Overview Dashboard
- Total users, drivers, rides, and revenue
- Active rides and online drivers
- Revenue and rides charts
- Recent ride activity

### Users
- View all registered users
- Search and filter functionality
- User verification status
- Total rides and ratings
- Export user data

### Drivers
- Driver list with verification status
- Approve/reject driver applications
- View vehicle information
- Monitor online/offline status
- Driver performance metrics

### Subscriptions
- Create and manage subscription plans
- View active driver subscriptions
- Track subscription revenue
- Monitor rides completed per subscription

### Rides
- Real-time ride monitoring
- Filter by status (pending, active, completed, cancelled)
- View pickup/dropoff locations
- Fare and distance information
- Export ride data

### Payments
- Transaction history
- Payment status tracking
- Refund management
- Revenue analytics

### Promo Codes
- Create promotional campaigns
- Set discount types (percentage/fixed)
- Configure usage limits
- Track promo code performance

### Analytics
- Revenue trends
- Ride statistics
- Driver performance
- Marketing analytics
- Subscription metrics

### Settings
- Profile management
- Change password
- App configuration
- Notification preferences

## 🎨 UI Components

Built with shadcn/ui components:
- Button, Input, Label
- Card, Dialog, Badge
- Table, Tabs, Select
- Toast notifications
- And more...

## 🔄 API Integration

The dashboard connects to your backend API:

```typescript
// Example API call
import { apiClient } from '@/lib/api';

const users = await apiClient.users.getAll();
const stats = await apiClient.dashboard.getOverview();
```

All API calls include:
- Automatic token injection
- Error handling
- Response interceptors
- Loading states

## 📱 Responsive Design

- Mobile-friendly sidebar
- Responsive tables
- Adaptive charts
- Touch-friendly controls

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

Ensure these are set in production:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

### Deploy to Vercel

```bash
vercel deploy
```

Or use the Vercel GitHub integration for automatic deployments.

## 📄 License

Private - Pikkar Ride-Sharing Platform

## 👥 Support

For support, contact the development team.

