export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'driver' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  rating?: number;
  totalRides?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver extends User {
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  licenseNumber: string;
  licenseImage?: string;
  vehicleImage?: string;
  isVerified: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  searchRadiusKm?: number;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  isAvailable: boolean;
  documentsVerified: boolean;
}

export interface Ride {
  _id: string;
  userId: User;
  driverId?: Driver;
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    address: string;
    coordinates: [number, number];
  };
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';
  fare: number;
  distance: number;
  duration: number;
  paymentMethod: 'card' | 'cash' | 'wallet';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  userId: string;
  rideId?: string;
  amount: number;
  type: 'ride' | 'wallet_topup' | 'refund' | 'subscription';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  durationDays?: number;
  price: number;
  originalPrice?: number;
  currency?: string;
  features: string[];
  isActive: boolean;
  maxRides?: number; // legacy
  maxRidesPerDay?: number;
  code?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  isBestValue?: boolean;
  isTrial?: boolean;
  sortOrder?: number;
  discount?: number;
  discountLabel?: string;
  appliesToCategory?: 'ride' | 'parcel' | 'all';
  appliesToVehicleType?: string;
  serviceId?: string | { _id: string; name: string; code: string; category: string; vehicleType: string };
  createdAt: string;
  updatedAt: string;
}

export interface DriverSubscription {
  _id: string;
  driverId: Driver | string;
  planId: SubscriptionPlan | string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
  ridesCompleted: number;
  totalEarnings: number;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCode {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxDiscount?: number;
  minRideAmount?: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  applicableFor: 'all' | 'new_users' | 'specific_users';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  activeRides: number;
  todayRevenue: number;
  monthlyRevenue: number;
  activeDrivers: number;
  pendingVerifications: number;
  recentRides: Ride[];
  revenueChart: Array<{ date: string; revenue: number }>;
  ridesChart: Array<{ date: string; count: number }>;
  topDrivers: Array<{
    driver: Driver;
    totalRides: number;
    totalEarnings: number;
    rating: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

