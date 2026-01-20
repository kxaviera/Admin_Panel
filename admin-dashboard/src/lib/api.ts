import axios from 'axios';

// Use same-origin base by default; Next.js rewrites proxy /api/v1/* to backend.
// Override with NEXT_PUBLIC_API_URL if you want to hit a remote backend directly.
// IMPORTANT (local dev):
// Use same-origin `/api/v1/` so requests go through Next.js rewrites (no CORS).
// If NEXT_PUBLIC_API_URL is set to an absolute URL (http://...), it can cause
// browser CORS failures that show up as "Network Error" in axios.
const rawEnvUrl = process.env.NEXT_PUBLIC_API_URL;
const base = rawEnvUrl != null && rawEnvUrl.startsWith('/') ? rawEnvUrl : '/api/v1/';
// Keep trailing slash so axios joins paths correctly:
// baseURL '/api/v1/' + 'auth/login' => '/api/v1/auth/login'
const API_URL = base.replace(/\/?$/, '/');

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiClient = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      api.post('auth/login', { email, password }),
    getProfile: () => api.get('auth/me'),
    logout: () => api.post('auth/logout'),
    updateProfile: (data: { name?: string; firstName?: string; lastName?: string; email?: string; phone?: string }) =>
      api.put('auth/profile', data),
    updatePassword: (currentPassword: string, newPassword: string) =>
      api.put('auth/update-password', { currentPassword, newPassword }),
  },

  // Dashboard
  dashboard: {
    getOverview: () => api.get('analytics/dashboard'),
  },

  // Users
  users: {
    getAll: (params?: any) => api.get('users', { params }),
    getById: (id: string) => api.get(`users/${id}`),
    update: (id: string, data: any) => api.put(`users/${id}`, data),
    delete: (id: string) => api.delete(`users/${id}`),
    getStats: () => api.get('users/stats'),
  },

  // Drivers
  drivers: {
    getAll: (params?: any) => api.get('drivers', { params }),
    getById: (id: string) => api.get(`drivers/${id}`),
    update: (id: string, data: any) => api.put(`drivers/${id}`, data),
    verify: (id: string, status: 'approved' | 'rejected') =>
      api.put(`drivers/${id}/verify`, { status }),
    getStats: () => api.get('drivers/stats'),
    getMap: (params?: any) => api.get('drivers/map', { params }),
    getHeatmap: (params?: any) => api.get('drivers/heatmap', { params }),
  },

  // Driver Applications
  driverApplications: {
    getAll: (params?: any) => api.get('driver-applications', { params }),
  },

  // Rides
  rides: {
    getAll: (params?: any) => api.get('rides', { params }),
    getById: (id: string) => api.get(`rides/${id}`),
    getStats: () => api.get('rides/stats'),
  },

  // Parcels (Delivery Orders)
  parcels: {
    getAll: (params?: any) => api.get('parcels', { params }),
    getById: (id: string) => api.get(`parcels/${id}`),
    cancel: (id: string, reason?: string) => api.put(`parcels/${id}/cancel`, { reason }),
  },

  // SOS
  sos: {
    getAll: (params?: any) => api.get('sos', { params }),
    getById: (id: string) => api.get(`sos/${id}`),
    updateStatus: (id: string, status: string, payload?: any) =>
      api.patch(`sos/${id}/status`, { status, ...(payload || {}) }),
  },

  // Chats
  chats: {
    getAll: (params?: any) => api.get('chats', { params }),
    getById: (id: string, params?: any) => api.get(`chats/${id}`, { params }),
    sendMessage: (id: string, message: string, attachments?: string[]) =>
      api.post(`chats/${id}/messages`, { message, attachments }),
  },

  // Freight
  freight: {
    getAll: (params?: any) => api.get('freight', { params }),
    getById: (id: string) => api.get(`freight/${id}`),
    updateStatus: (id: string, status: string) => api.patch(`freight/${id}/status`, { status }),
  },

  // Fleet Managers
  fleetManagers: {
    getAll: (params?: any) => api.get('fleet-managers', { params }),
    getById: (id: string) => api.get(`fleet-managers/${id}`),
    create: (data: any) => api.post('fleet-managers', data),
    update: (id: string, data: any) => api.put(`fleet-managers/${id}`, data),
    resetPassword: (id: string, password?: string) => api.patch(`fleet-managers/${id}/reset-password`, { password }),
    delete: (id: string) => api.delete(`fleet-managers/${id}`),
  },

  // Fleet Vehicles
  fleetVehicles: {
    getAll: (params?: any) => api.get('fleet-vehicles', { params }),
    getById: (id: string) => api.get(`fleet-vehicles/${id}`),
    create: (data: any) => api.post('fleet-vehicles', data),
    update: (id: string, data: any) => api.put(`fleet-vehicles/${id}`, data),
    delete: (id: string) => api.delete(`fleet-vehicles/${id}`),
  },

  // Dispatchers
  dispatchers: {
    getAll: (params?: any) => api.get('dispatchers', { params }),
    getById: (id: string) => api.get(`dispatchers/${id}`),
    create: (data: any) => api.post('dispatchers', data),
    update: (id: string, data: any) => api.put(`dispatchers/${id}`, data),
    resetPassword: (id: string, password?: string) => api.patch(`dispatchers/${id}/reset-password`, { password }),
    delete: (id: string) => api.delete(`dispatchers/${id}`),
  },

  // CMS: Blogs
  blogs: {
    getAll: (params?: any) => api.get('blogs', { params }),
    getById: (id: string) => api.get(`blogs/${id}`),
    create: (data: any) => api.post('blogs', data),
    update: (id: string, data: any) => api.put(`blogs/${id}`, data),
    delete: (id: string) => api.delete(`blogs/${id}`),
  },

  // CMS: Pages
  pages: {
    getAll: (params?: any) => api.get('pages', { params }),
    getById: (id: string) => api.get(`pages/${id}`),
    create: (data: any) => api.post('pages', data),
    update: (id: string, data: any) => api.put(`pages/${id}`, data),
    delete: (id: string) => api.delete(`pages/${id}`),
  },

  // CMS: FAQs
  faqs: {
    getAll: (params?: any) => api.get('faqs', { params }),
    getById: (id: string) => api.get(`faqs/${id}`),
    create: (data: any) => api.post('faqs', data),
    update: (id: string, data: any) => api.put(`faqs/${id}`, data),
    delete: (id: string) => api.delete(`faqs/${id}`),
  },

  // Media
  media: {
    getAll: (params?: any) => api.get('media', { params }),
    create: (data: any) => api.post('media', data),
    delete: (id: string) => api.delete(`media/${id}`),
  },

  uploads: {
    uploadSingle: (file: File, folder?: string) => {
      const form = new FormData();
      form.append('file', file);
      if (folder) form.append('folder', folder);
      return api.post('upload/single', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
  },

  // Payments
  payments: {
    getAll: (params?: any) => api.get('payments', { params }),
    getById: (id: string) => api.get(`payments/${id}`),
    refund: (id: string, reason: string) =>
      api.post(`payments/${id}/refund`, { reason }),
    getStats: () => api.get('payments/stats'),
  },

  // Subscriptions
  subscriptions: {
    // Admin dashboard needs inactive plans too
    getPlans: () => api.get('subscriptions/plans/admin'),
    createPlan: (data: any) => api.post('subscriptions/plans', data),
    updatePlan: (id: string, data: any) =>
      api.put(`subscriptions/plans/${id}`, data),
    deletePlan: (id: string) => api.delete(`subscriptions/plans/${id}`),
    getAll: (params?: any) => api.get('subscriptions', { params }),
    getStats: () => api.get('subscriptions/stats'),
  },

  // Promo Codes
  promo: {
    getAll: (params?: any) => api.get('promo', { params }),
    create: (data: any) => api.post('promo', data),
    update: (id: string, data: any) => api.put(`promo/${id}`, data),
    delete: (id: string) => api.delete(`promo/${id}`),
    getStats: () => api.get('promo/stats'),
  },

  // Referrals
  referrals: {
    getAll: (params?: any) => api.get('referral', { params }),
    getStats: () => api.get('referral/stats'),
  },

  // Analytics
  analytics: {
    getDashboard: () => api.get('analytics/dashboard'),
    getRides: (params?: any) => api.get('analytics/rides', { params }),
    getRevenue: (params?: any) => api.get('analytics/revenue', { params }),
    getDriverPerformance: () => api.get('analytics/driver-performance'),
    getMarketing: () => api.get('analytics/marketing'),
  },

  // Wallet
  wallet: {
    getAll: (params?: any) => api.get('wallet/all', { params }),
    getStats: () => api.get('wallet/admin/stats'),
  },

  // Vehicle Types (Ride Vehicles)
  vehicleTypes: {
    getAll: () => api.get('vehicle-types'),
    getActive: () => api.get('vehicle-types/active'),
    getById: (id: string) => api.get(`vehicle-types/${id}`),
    create: (data: any) => api.post('vehicle-types', data),
    update: (id: string, data: any) => api.put(`vehicle-types/${id}`, data),
    updatePricing: (id: string, pricing: any) => api.patch(`vehicle-types/${id}/pricing`, pricing),
    delete: (id: string) => api.delete(`vehicle-types/${id}`),
    toggle: (id: string) => api.patch(`vehicle-types/${id}/toggle`),
    calculateFare: (vehicleId: string, distanceKm: number, timeMinutes: number) =>
      api.post('vehicle-types/calculate-fare', { vehicleId, distanceKm, timeMinutes }),
  },

  // Parcel Vehicles
  parcelVehicles: {
    getAll: () => api.get('parcel-vehicles'),
    getActive: () => api.get('parcel-vehicles/active'),
    getById: (id: string) => api.get(`parcel-vehicles/${id}`),
    create: (data: any) => api.post('parcel-vehicles', data),
    update: (id: string, data: any) => api.put(`parcel-vehicles/${id}`, data),
    updatePricing: (id: string, pricing: any) => api.patch(`parcel-vehicles/${id}/pricing`, pricing),
    delete: (id: string) => api.delete(`parcel-vehicles/${id}`),
    toggle: (id: string) => api.patch(`parcel-vehicles/${id}/toggle`),
    calculatePrice: (vehicleId: string, distanceKm: number, weightKg: number, dimensions?: any) =>
      api.post('parcel-vehicles/calculate-price', { vehicleId, distanceKm, weightKg, ...dimensions }),
    findSuitable: (params: any) => api.get('parcel-vehicles/find-suitable', { params }),
  },

  // Configuration
  config: {
    getFirebaseStatus: () => api.get('config/firebase'),
    setFirebase: (projectId: string, clientEmail: string, privateKey: string) =>
      api.post('config/firebase', { projectId, clientEmail, privateKey }),
  },

  zones: {
    getAll: (params?: any) => api.get('zones', { params }),
  },
};

