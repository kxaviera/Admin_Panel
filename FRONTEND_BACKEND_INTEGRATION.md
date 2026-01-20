# 🔗 Connect Pikkar Frontend to Admin_Panel Backend

## 📁 **YOUR SETUP:**
```
/Users/santhoshreddy/
├── pikkar/               ← Your Frontend (User/Driver Apps)
│   └── (React Native/React app)
└── Admin_Panel/          ← Your Backend (APIs)
    └── (Node.js/Express server - port 5001)
```

---

## 🎯 **GOAL:**
Connect your Pikkar frontend to fetch data from Admin_Panel backend APIs.

---

## 🚀 **STEP-BY-STEP INTEGRATION:**

### **STEP 1: Create API Service in Pikkar Frontend**

Create a file: `pikkar/src/services/api.js` (or `.ts` for TypeScript)

```javascript
// pikkar/src/services/api.js
import axios from 'axios';

// Backend API URL
const API_URL = 'http://localhost:5001/api/v1';  // Development
// const API_URL = 'https://your-domain.com/api/v1';  // Production

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken'); // or AsyncStorage in React Native
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// ============================================
// AUTH APIs
// ============================================
export const authAPI = {
  // User/Driver Login
  login: (email, password, role = 'user') => 
    apiClient.post('/auth/login', { email, password, role }),

  // User/Driver Signup
  signup: (data) => 
    apiClient.post('/auth/signup', data),

  // Get Profile
  getProfile: () => 
    apiClient.get('/auth/me'),

  // Update Profile
  updateProfile: (data) => 
    apiClient.put('/auth/profile', data),

  // Logout
  logout: () => 
    apiClient.post('/auth/logout'),
};

// ============================================
// VEHICLE TYPES APIs (Ride Vehicles)
// ============================================
export const vehicleTypesAPI = {
  // Get all active vehicle types for booking
  getActive: () => 
    apiClient.get('/vehicle-types/active'),

  // Calculate ride fare
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
export const parcelVehiclesAPI = {
  // Get all active parcel vehicles
  getActive: () => 
    apiClient.get('/parcel-vehicles/active'),

  // Find suitable vehicles for parcel
  findSuitable: (weightKg, length, width, height, distanceKm) => {
    const params = new URLSearchParams({
      weightKg,
      length,
      width,
      height,
      distanceKm,
    });
    return apiClient.get(`/parcel-vehicles/find-suitable?${params}`);
  },

  // Calculate delivery price
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
export const ridesAPI = {
  // Create new ride booking
  create: (data) => 
    apiClient.post('/rides', data),

  // Get user's rides
  getMyRides: (status) => 
    apiClient.get(`/rides/my-rides${status ? `?status=${status}` : ''}`),

  // Get ride details
  getById: (rideId) => 
    apiClient.get(`/rides/${rideId}`),

  // Cancel ride
  cancel: (rideId, reason) => 
    apiClient.put(`/rides/${rideId}/cancel`, { reason }),

  // Rate ride
  rate: (rideId, rating, review) => 
    apiClient.post(`/rides/${rideId}/rate`, { rating, review }),
};

// ============================================
// DRIVER APIs
// ============================================
export const driverAPI = {
  // Get nearby drivers
  getNearby: (latitude, longitude, radius = 5) => {
    const params = new URLSearchParams({ latitude, longitude, radius });
    return apiClient.get(`/drivers/nearby?${params}`);
  },

  // Get driver details
  getById: (driverId) => 
    apiClient.get(`/drivers/${driverId}`),

  // Apply as driver
  apply: (data) => 
    apiClient.post('/drivers/apply', data),
};

// ============================================
// PAYMENTS APIs
// ============================================
export const paymentsAPI = {
  // Create payment intent
  createIntent: (amount, rideId) => 
    apiClient.post('/payments/create-intent', { amount, rideId }),

  // Confirm payment
  confirm: (paymentIntentId) => 
    apiClient.post('/payments/confirm', { paymentIntentId }),

  // Get payment history
  getHistory: () => 
    apiClient.get('/payments/my-payments'),
};

// ============================================
// WALLET APIs
// ============================================
export const walletAPI = {
  // Get wallet balance
  getBalance: () => 
    apiClient.get('/wallet/balance'),

  // Add money to wallet
  addMoney: (amount, paymentMethod) => 
    apiClient.post('/wallet/add-money', { amount, paymentMethod }),

  // Get wallet transactions
  getTransactions: () => 
    apiClient.get('/wallet/transactions'),
};

// ============================================
// PROMO CODES APIs
// ============================================
export const promoAPI = {
  // Get available promo codes
  getAvailable: () => 
    apiClient.get('/promo/available'),

  // Apply promo code
  apply: (code, amount) => 
    apiClient.post('/promo/apply', { code, amount }),

  // Validate promo code
  validate: (code) => 
    apiClient.post('/promo/validate', { code }),
};

// ============================================
// SUBSCRIPTIONS APIs (for Drivers)
// ============================================
export const subscriptionsAPI = {
  // Get subscription plans
  getPlans: () => 
    apiClient.get('/subscriptions/plans'),

  // Get active subscription
  getActive: () => 
    apiClient.get('/subscriptions/active'),

  // Subscribe to plan
  subscribe: (planId, paymentMethod) => 
    apiClient.post('/subscriptions/subscribe', { planId, paymentMethod }),

  // Cancel subscription
  cancel: () => 
    apiClient.post('/subscriptions/cancel'),
};

// Export all APIs
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
};
```

---

### **STEP 2: Install Axios (if not already installed)**

```bash
cd pikkar
npm install axios
# or
yarn add axios
```

---

### **STEP 3: Use APIs in Your Components**

#### **Example 1: Fetch Available Vehicles for Ride Booking**

```javascript
// pikkar/src/screens/BookRideScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { vehicleTypesAPI } from '../services/api';

const BookRideScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleTypesAPI.getActive();
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicle) => {
    try {
      // Calculate fare
      const fareResponse = await vehicleTypesAPI.calculateFare(
        vehicle._id,
        10, // distance in km
        20  // estimated time in minutes
      );
      
      console.log('Estimated Fare:', fareResponse.data.totalFare);
      // Navigate to booking confirmation
    } catch (error) {
      console.error('Error calculating fare:', error);
    }
  };

  if (loading) {
    return <Text>Loading vehicles...</Text>;
  }

  return (
    <View>
      <Text>Select Vehicle Type</Text>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelectVehicle(item)}>
            <View>
              {item.iconSideView ? (
                <img src={item.iconSideView} alt={item.name} />
              ) : (
                <Text>{item.icon}</Text>
              )}
              <Text>{item.name}</Text>
              <Text>{item.description}</Text>
              <Text>Base Fare: ₹{item.pricing.baseFare}</Text>
              <Text>Per KM: ₹{item.pricing.perKmRate}</Text>
              <Text>Capacity: {item.capacity.passengers} passengers</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default BookRideScreen;
```

---

#### **Example 2: Parcel Delivery - Find Suitable Vehicles**

```javascript
// pikkar/src/screens/SendParcelScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { parcelVehiclesAPI } from '../services/api';

const SendParcelScreen = () => {
  const [parcelDetails, setParcelDetails] = useState({
    weight: '',
    length: '',
    width: '',
    height: '',
    distance: '',
  });
  const [suitableVehicles, setSuitableVehicles] = useState([]);

  const findSuitableVehicles = async () => {
    try {
      const response = await parcelVehiclesAPI.findSuitable(
        parseFloat(parcelDetails.weight),
        parseFloat(parcelDetails.length),
        parseFloat(parcelDetails.width),
        parseFloat(parcelDetails.height),
        parseFloat(parcelDetails.distance)
      );
      
      setSuitableVehicles(response.data);
    } catch (error) {
      console.error('Error finding vehicles:', error);
      alert('Failed to find suitable vehicles');
    }
  };

  const handleSelectVehicle = async (vehicle) => {
    try {
      const priceResponse = await parcelVehiclesAPI.calculatePrice(
        vehicle._id,
        parseFloat(parcelDetails.distance),
        parseFloat(parcelDetails.weight)
      );
      
      console.log('Delivery Price:', priceResponse.data.totalPrice);
      alert(`Estimated Price: ₹${priceResponse.data.totalPrice}`);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  return (
    <View>
      <Text>Parcel Details</Text>
      <TextInput
        placeholder="Weight (kg)"
        value={parcelDetails.weight}
        onChangeText={(text) => setParcelDetails({ ...parcelDetails, weight: text })}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Length (cm)"
        value={parcelDetails.length}
        onChangeText={(text) => setParcelDetails({ ...parcelDetails, length: text })}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Width (cm)"
        value={parcelDetails.width}
        onChangeText={(text) => setParcelDetails({ ...parcelDetails, width: text })}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Height (cm)"
        value={parcelDetails.height}
        onChangeText={(text) => setParcelDetails({ ...parcelDetails, height: text })}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Distance (km)"
        value={parcelDetails.distance}
        onChangeText={(text) => setParcelDetails({ ...parcelDetails, distance: text })}
        keyboardType="numeric"
      />
      
      <Button title="Find Suitable Vehicles" onPress={findSuitableVehicles} />

      <FlatList
        data={suitableVehicles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelectVehicle(item)}>
            <View>
              <Text>{item.icon} {item.name}</Text>
              <Text>Max Weight: {item.capacity.maxWeight} kg</Text>
              <Text>Estimated: ₹{item.estimatedPrice}</Text>
              <Button title="Select" onPress={() => handleSelectVehicle(item)} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default SendParcelScreen;
```

---

#### **Example 3: User Login**

```javascript
// pikkar/src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await authAPI.login(email, password, 'user');
      
      // Save token
      const token = response.data.tokens.accessToken;
      localStorage.setItem('userToken', token); // or AsyncStorage
      
      // Save user data
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      
      Alert.alert('Success', 'Logged in successfully!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.message || 'Login failed');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
```

---

### **STEP 4: Configure Backend URL for Different Environments**

Create `pikkar/src/config/api.config.js`:

```javascript
// pikkar/src/config/api.config.js

const ENV = {
  development: {
    API_URL: 'http://localhost:5001/api/v1',
  },
  production: {
    API_URL: 'https://api.pikkar.com/api/v1', // Your production domain
  },
};

// Automatically detect environment
const environment = __DEV__ ? 'development' : 'production';

export const API_URL = ENV[environment].API_URL;

export default {
  API_URL,
};
```

Then update `api.js`:

```javascript
import { API_URL } from '../config/api.config';

const apiClient = axios.create({
  baseURL: API_URL,
  // ... rest of config
});
```

---

### **STEP 5: Handle React Native Specific Issues**

#### **For React Native (iOS/Android):**

1. **Install axios:**
   ```bash
   npm install axios
   ```

2. **Use AsyncStorage instead of localStorage:**
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

3. **Update api.js for React Native:**
   ```javascript
   import AsyncStorage from '@react-native-async-storage/async-storage';

   apiClient.interceptors.request.use(
     async (config) => {
       const token = await AsyncStorage.getItem('userToken');
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
       return config;
     }
   );
   ```

4. **For iOS, update Info.plist for localhost access:**
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsLocalNetworking</key>
     <true/>
   </dict>
   ```

5. **Use correct localhost URL:**
   - **Android Emulator:** `http://10.0.2.2:5001/api/v1`
   - **iOS Simulator:** `http://localhost:5001/api/v1`
   - **Physical Device:** `http://YOUR_COMPUTER_IP:5001/api/v1`

---

### **STEP 6: Test API Connection**

Create a test component:

```javascript
// pikkar/src/screens/TestAPIScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import axios from 'axios';

const TestAPIScreen = () => {
  const [status, setStatus] = useState('Testing...');

  const testConnection = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/v1/health');
      setStatus(`✅ Connected! ${JSON.stringify(response.data)}`);
    } catch (error) {
      setStatus(`❌ Failed: ${error.message}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View>
      <Text>{status}</Text>
      <Button title="Test Again" onPress={testConnection} />
    </View>
  );
};

export default TestAPIScreen;
```

---

## 📊 **SUMMARY:**

### **What You Need to Do:**

1. ✅ Copy `api.js` to your Pikkar frontend
2. ✅ Install axios
3. ✅ Update components to use API functions
4. ✅ Configure API_URL for your environment
5. ✅ Test connection with health check

### **API Endpoints Available:**

- ✅ `/auth/*` - Login, signup, profile
- ✅ `/vehicle-types/*` - Ride vehicles
- ✅ `/parcel-vehicles/*` - Delivery vehicles
- ✅ `/rides/*` - Ride bookings
- ✅ `/drivers/*` - Driver info
- ✅ `/payments/*` - Payments
- ✅ `/wallet/*` - Wallet
- ✅ `/promo/*` - Promo codes
- ✅ `/subscriptions/*` - Subscriptions

---

## 🚀 **NEXT STEPS:**

1. Create `api.js` in your Pikkar project
2. Import and use in your components
3. Test with backend running on port 5001
4. Deploy backend and update API_URL for production

**Need help with a specific screen or feature? Let me know!** 🎉

