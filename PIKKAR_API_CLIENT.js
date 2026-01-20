/**
 * 🚀 PIKKAR FRONTEND - API CLIENT
 * 
 * Copy this file to your Pikkar frontend:
 * pikkar/src/services/api.js
 * 
 * Then import and use:
 * import api from './services/api';
 * const vehicles = await api.vehicleTypes.getActive();
 */

import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================

// Backend API URL - Change based on environment
const API_URL = 'http://localhost:5001/api/v1';  // Development

// For React Native on different platforms:
// const API_URL = 'http://10.0.2.2:5001/api/v1';  // Android Emulator
// const API_URL = 'http://YOUR_IP_ADDRESS:5001/api/v1';  // Physical Device
// const API_URL = 'https://api.pikkar.com/api/v1';  // Production

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// INTERCEPTORS
// ============================================

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    // For React.js (Web)
    const token = localStorage.getItem('userToken');
    
    // For React Native, use AsyncStorage:
    // const token = await AsyncStorage.getItem('userToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📡 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response.data;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized - Logout user
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      // Redirect to login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// ============================================
// AUTH APIs
// ============================================
const authAPI = {
  /**
   * Login user or driver
   * @param {string} email 
   * @param {string} password 
   * @param {string} role - 'user' or 'driver'
   */
  login: (email, password, role = 'user') => 
    apiClient.post('/auth/login', { email, password, role }),

  /**
   * Signup new user
   */
  signup: (data) => 
    apiClient.post('/auth/signup', data),

  /**
   * Get current user profile
   */
  getProfile: () => 
    apiClient.get('/auth/me'),

  /**
   * Update user profile
   */
  updateProfile: (data) => 
    apiClient.put('/auth/profile', data),

  /**
   * Logout
   */
  logout: () => 
    apiClient.post('/auth/logout'),

  /**
   * Forgot password
   */
  forgotPassword: (email) => 
    apiClient.post('/auth/forgot-password', { email }),

  /**
   * Reset password
   */
  resetPassword: (token, newPassword) => 
    apiClient.post('/auth/reset-password', { token, newPassword }),
};

// ============================================
// VEHICLE TYPES APIs (Ride Vehicles)
// ============================================
const vehicleTypesAPI = {
  /**
   * Get all active ride vehicle types
   * Returns: Array of vehicles with pricing and capacity
   */
  getActive: () => 
    apiClient.get('/vehicle-types/active'),

  /**
   * Calculate ride fare
   * @param {string} vehicleId - Vehicle type ID
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} timeMinutes - Estimated time in minutes
   */
  calculateFare: (vehicleId, distanceKm, timeMinutes) => 
    apiClient.post('/vehicle-types/calculate-fare', {
      vehicleId,
      distanceKm,
      timeMinutes,
    }),
};

// ============================================
// PARCEL VEHICLES APIs (Delivery Vehicles)
// ============================================
const parcelVehiclesAPI = {
  /**
   * Get all active parcel delivery vehicles
   */
  getActive: () => 
    apiClient.get('/parcel-vehicles/active'),

  /**
   * Find suitable vehicles for parcel dimensions
   * @param {number} weightKg - Parcel weight in kg
   * @param {number} length - Length in cm
   * @param {number} width - Width in cm
   * @param {number} height - Height in cm
   * @param {number} distanceKm - Delivery distance in km
   */
  findSuitable: (weightKg, length, width, height, distanceKm) => {
    const params = new URLSearchParams({
      weightKg: weightKg.toString(),
      length: length.toString(),
      width: width.toString(),
      height: height.toString(),
      distanceKm: distanceKm.toString(),
    });
    return apiClient.get(`/parcel-vehicles/find-suitable?${params}`);
  },

  /**
   * Calculate parcel delivery price
   * @param {string} vehicleId - Vehicle type ID
   * @param {number} distanceKm - Distance in kilometers
   * @param {number} weightKg - Parcel weight in kg
   * @param {object} dimensions - Optional: { length, width, height }
   */
  calculatePrice: (vehicleId, distanceKm, weightKg, dimensions = {}) => 
    apiClient.post('/parcel-vehicles/calculate-price', {
      vehicleId,
      distanceKm,
      weightKg,
      ...dimensions,
    }),
};

// ============================================
// RIDES APIs
// ============================================
const ridesAPI = {
  /**
   * Create new ride booking
   * @param {object} data - { vehicleType, pickup, dropoff, ... }
   */
  create: (data) => 
    apiClient.post('/rides', data),

  /**
   * Get user's rides
   * @param {string} status - Optional: 'pending', 'accepted', 'completed', etc.
   */
  getMyRides: (status) => 
    apiClient.get(`/rides/my-rides${status ? `?status=${status}` : ''}`),

  /**
   * Get ride details by ID
   */
  getById: (rideId) => 
    apiClient.get(`/rides/${rideId}`),

  /**
   * Cancel ride
   */
  cancel: (rideId, reason) => 
    apiClient.put(`/rides/${rideId}/cancel`, { reason }),

  /**
   * Rate completed ride
   */
  rate: (rideId, rating, review) => 
    apiClient.post(`/rides/${rideId}/rate`, { rating, review }),

  /**
   * Get ride stats
   */
  getStats: () => 
    apiClient.get('/rides/stats'),
};

// ============================================
// DRIVER APIs
// ============================================
const driverAPI = {
  /**
   * Get nearby drivers
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} radius - Radius in km (default: 5)
   */
  getNearby: (latitude, longitude, radius = 5) => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString(),
    });
    return apiClient.get(`/drivers/nearby?${params}`);
  },

  /**
   * Get driver details
   */
  getById: (driverId) => 
    apiClient.get(`/drivers/${driverId}`),

  /**
   * Apply to become a driver
   */
  apply: (data) => 
    apiClient.post('/drivers/apply', data),

  /**
   * Get driver stats (for driver app)
   */
  getStats: () => 
    apiClient.get('/drivers/stats'),
};

// ============================================
// PAYMENTS APIs
// ============================================
const paymentsAPI = {
  /**
   * Create payment intent
   */
  createIntent: (amount, rideId, paymentMethod = 'card') => 
    apiClient.post('/payments/create-intent', { amount, rideId, paymentMethod }),

  /**
   * Confirm payment
   */
  confirm: (paymentIntentId) => 
    apiClient.post('/payments/confirm', { paymentIntentId }),

  /**
   * Get payment history
   */
  getHistory: (limit = 20, skip = 0) => 
    apiClient.get(`/payments/my-payments?limit=${limit}&skip=${skip}`),

  /**
   * Request refund
   */
  requestRefund: (paymentId, reason) => 
    apiClient.post(`/payments/${paymentId}/refund`, { reason }),
};

// ============================================
// WALLET APIs
// ============================================
const walletAPI = {
  /**
   * Get wallet balance
   */
  getBalance: () => 
    apiClient.get('/wallet/balance'),

  /**
   * Add money to wallet
   */
  addMoney: (amount, paymentMethod = 'card') => 
    apiClient.post('/wallet/add-money', { amount, paymentMethod }),

  /**
   * Get wallet transactions
   */
  getTransactions: (limit = 20, skip = 0) => 
    apiClient.get(`/wallet/transactions?limit=${limit}&skip=${skip}`),

  /**
   * Withdraw money (for drivers)
   */
  withdraw: (amount, bankAccount) => 
    apiClient.post('/wallet/withdraw', { amount, bankAccount }),
};

// ============================================
// PROMO CODES APIs
// ============================================
const promoAPI = {
  /**
   * Get available promo codes
   */
  getAvailable: () => 
    apiClient.get('/promo/available'),

  /**
   * Apply promo code
   */
  apply: (code, amount) => 
    apiClient.post('/promo/apply', { code, amount }),

  /**
   * Validate promo code
   */
  validate: (code) => 
    apiClient.post('/promo/validate', { code }),
};

// ============================================
// SUBSCRIPTIONS APIs (for Drivers)
// ============================================
const subscriptionsAPI = {
  /**
   * Get subscription plans
   */
  getPlans: () => 
    apiClient.get('/subscriptions/plans'),

  /**
   * Get active subscription
   */
  getActive: () => 
    apiClient.get('/subscriptions/active'),

  /**
   * Subscribe to plan
   */
  subscribe: (planId, paymentMethod = 'card') => 
    apiClient.post('/subscriptions/subscribe', { planId, paymentMethod }),

  /**
   * Cancel subscription
   */
  cancel: (reason) => 
    apiClient.post('/subscriptions/cancel', { reason }),

  /**
   * Get subscription stats
   */
  getStats: () => 
    apiClient.get('/subscriptions/stats'),
};

// ============================================
// REFERRAL APIs
// ============================================
const referralAPI = {
  /**
   * Get referral code
   */
  getCode: () => 
    apiClient.get('/referral/my-code'),

  /**
   * Apply referral code
   */
  apply: (code) => 
    apiClient.post('/referral/apply', { code }),

  /**
   * Get referral stats
   */
  getStats: () => 
    apiClient.get('/referral/stats'),

  /**
   * Get referral history
   */
  getHistory: () => 
    apiClient.get('/referral/history'),
};

// ============================================
// USER APIs
// ============================================
const userAPI = {
  /**
   * Update user location (for real-time tracking)
   */
  updateLocation: (latitude, longitude) => 
    apiClient.put('/users/location', { latitude, longitude }),

  /**
   * Get user by ID
   */
  getById: (userId) => 
    apiClient.get(`/users/${userId}`),

  /**
   * Update user profile
   */
  update: (data) => 
    apiClient.put('/users/profile', data),

  /**
   * Upload profile picture
   */
  uploadPicture: (formData) => 
    apiClient.post('/upload/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Save auth token
 */
export const saveToken = (token) => {
  localStorage.setItem('userToken', token);
  // For React Native: await AsyncStorage.setItem('userToken', token);
};

/**
 * Get auth token
 */
export const getToken = () => {
  return localStorage.getItem('userToken');
  // For React Native: return await AsyncStorage.getItem('userToken');
};

/**
 * Remove auth token (logout)
 */
export const removeToken = () => {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  // For React Native: await AsyncStorage.multiRemove(['userToken', 'userData']);
};

/**
 * Save user data
 */
export const saveUserData = (userData) => {
  localStorage.setItem('userData', JSON.stringify(userData));
};

/**
 * Get user data
 */
export const getUserData = () => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

// ============================================
// EXPORT ALL APIs
// ============================================
export default {
  auth: authAPI,
  vehicleTypes: vehicleTypesAPI,
  parcelVehicles: parcelVehiclesAPI,
  rides: ridesAPI,
  driver: driverAPI,
  payments: paymentsAPI,
  wallet: walletAPI,
  promo: promoAPI,
  subscriptions: subscriptionsAPI,
  referral: referralAPI,
  user: userAPI,
};

// Named exports for convenience
export {
  authAPI,
  vehicleTypesAPI,
  parcelVehiclesAPI,
  ridesAPI,
  driverAPI,
  paymentsAPI,
  walletAPI,
  promoAPI,
  subscriptionsAPI,
  referralAPI,
  userAPI,
  saveToken,
  getToken,
  removeToken,
  saveUserData,
  getUserData,
};

