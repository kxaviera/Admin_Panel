# 🚀 Quick Setup: Connect Pikkar Frontend to Backend

## ⚡ **5-MINUTE SETUP**

### **STEP 1: Copy API Client to Your Pikkar Frontend**

```bash
# Navigate to your Pikkar folder
cd /Users/santhoshreddy/pikkar

# Create services folder if it doesn't exist
mkdir -p src/services

# Copy the API client file
cp /Users/santhoshreddy/Admin_Panel/PIKKAR_API_CLIENT.js src/services/api.js
```

---

### **STEP 2: Install Axios**

```bash
cd /Users/santhoshreddy/pikkar

# Install axios
npm install axios
# or
yarn add axios
```

---

### **STEP 3: Use API in Your Components**

#### **Example: Fetch Ride Vehicles**

```javascript
// pikkar/src/screens/VehicleSelectionScreen.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';

function VehicleSelectionScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.vehicleTypes.getActive();
      setVehicles(response.data);
      console.log('✅ Vehicles loaded:', response.data);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Select Vehicle</h2>
      {vehicles.map(vehicle => (
        <div key={vehicle._id}>
          <span>{vehicle.icon || vehicle.iconSideView}</span>
          <h3>{vehicle.name}</h3>
          <p>Base Fare: ₹{vehicle.pricing.baseFare}</p>
          <p>Per KM: ₹{vehicle.pricing.perKmRate}</p>
        </div>
      ))}
    </div>
  );
}

export default VehicleSelectionScreen;
```

---

### **STEP 4: Test API Connection**

Create a test component:

```javascript
// pikkar/src/screens/TestAPIScreen.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function TestAPIScreen() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      // Test backend health
      const response = await axios.get('http://localhost:5001/api/v1/health');
      setStatus('✅ Backend Connected! ' + JSON.stringify(response.data));
      
      // Test vehicle types API
      const vehicles = await axios.get('http://localhost:5001/api/v1/vehicle-types/active');
      console.log('Vehicles:', vehicles.data);
    } catch (error) {
      setStatus('❌ Connection Failed: ' + error.message);
    }
  };

  return (
    <div>
      <h2>API Connection Test</h2>
      <p>{status}</p>
      <button onClick={testAPI}>Test Again</button>
    </div>
  );
}

export default TestAPIScreen;
```

---

## 📱 **FOR REACT NATIVE APPS:**

### **Additional Setup:**

1. **Install AsyncStorage:**
   ```bash
   npm install @react-native-async-storage/async-storage
   ```

2. **Update api.js for AsyncStorage:**
   ```javascript
   // Replace localStorage with AsyncStorage
   import AsyncStorage from '@react-native-async-storage/async-storage';

   // In interceptors
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

3. **Use Correct URL:**
   ```javascript
   // Android Emulator
   const API_URL = 'http://10.0.2.2:5001/api/v1';
   
   // iOS Simulator
   const API_URL = 'http://localhost:5001/api/v1';
   
   // Physical Device (use your computer's IP)
   const API_URL = 'http://192.168.1.100:5001/api/v1';
   ```

4. **Allow HTTP on iOS (Info.plist):**
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsLocalNetworking</key>
     <true/>
   </dict>
   ```

---

## 🎯 **COMMON USE CASES:**

### **1. User Login:**
```javascript
import api, { saveToken, saveUserData } from './services/api';

const handleLogin = async (email, password) => {
  try {
    const response = await api.auth.login(email, password, 'user');
    saveToken(response.data.tokens.accessToken);
    saveUserData(response.data.user);
    // Navigate to home
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
};
```

### **2. Book a Ride:**
```javascript
const bookRide = async (vehicleType, pickup, dropoff) => {
  try {
    const response = await api.rides.create({
      vehicleType,
      pickup: {
        address: pickup.address,
        coordinates: {
          latitude: pickup.lat,
          longitude: pickup.lng,
        }
      },
      dropoff: {
        address: dropoff.address,
        coordinates: {
          latitude: dropoff.lat,
          longitude: dropoff.lng,
        }
      },
      paymentMethod: 'cash',
    });
    
    console.log('Ride booked:', response.data);
    // Navigate to ride tracking
  } catch (error) {
    alert('Booking failed: ' + error.message);
  }
};
```

### **3. Calculate Fare:**
```javascript
const calculateFare = async (vehicleId, distance, time) => {
  try {
    const response = await api.vehicleTypes.calculateFare(
      vehicleId,
      distance, // in km
      time      // in minutes
    );
    
    return response.data.totalFare;
  } catch (error) {
    console.error('Fare calculation failed:', error);
    return null;
  }
};
```

### **4. Send Parcel:**
```javascript
const sendParcel = async (parcelDetails) => {
  try {
    // Find suitable vehicles
    const vehicles = await api.parcelVehicles.findSuitable(
      parcelDetails.weight,
      parcelDetails.length,
      parcelDetails.width,
      parcelDetails.height,
      parcelDetails.distance
    );
    
    // Calculate price for selected vehicle
    const priceResponse = await api.parcelVehicles.calculatePrice(
      vehicles.data[0]._id,
      parcelDetails.distance,
      parcelDetails.weight
    );
    
    console.log('Delivery price:', priceResponse.data.totalPrice);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### **5. Get Wallet Balance:**
```javascript
const getWalletBalance = async () => {
  try {
    const response = await api.wallet.getBalance();
    return response.data.balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};
```

---

## 🔧 **TROUBLESHOOTING:**

### **Problem: "Network Error"**
**Solution:**
- Make sure backend is running: `http://localhost:5001/api/v1/health`
- Check API_URL in api.js
- For React Native, use correct IP address

### **Problem: "CORS Error"**
**Solution:**
Backend is already configured for CORS. Make sure frontend URL is allowed.

### **Problem: "401 Unauthorized"**
**Solution:**
- Token might be expired
- Login again to get new token
- Check if token is being sent in headers

### **Problem: Can't connect from mobile device**
**Solution:**
- Use your computer's IP address instead of localhost
- Make sure both devices are on same network
- Check firewall settings

---

## 📊 **AVAILABLE API ENDPOINTS:**

### **All APIs Ready to Use:**

```javascript
// Auth
api.auth.login(email, password, role)
api.auth.signup(data)
api.auth.getProfile()

// Vehicle Types (Rides)
api.vehicleTypes.getActive()
api.vehicleTypes.calculateFare(vehicleId, distanceKm, timeMinutes)

// Parcel Vehicles
api.parcelVehicles.getActive()
api.parcelVehicles.findSuitable(weight, length, width, height, distance)
api.parcelVehicles.calculatePrice(vehicleId, distance, weight)

// Rides
api.rides.create(data)
api.rides.getMyRides(status)
api.rides.getById(rideId)
api.rides.cancel(rideId, reason)
api.rides.rate(rideId, rating, review)

// Drivers
api.driver.getNearby(lat, lng, radius)
api.driver.getById(driverId)

// Payments
api.payments.createIntent(amount, rideId)
api.payments.getHistory()

// Wallet
api.wallet.getBalance()
api.wallet.addMoney(amount)
api.wallet.getTransactions()

// Promo Codes
api.promo.getAvailable()
api.promo.apply(code, amount)

// Subscriptions (Drivers)
api.subscriptions.getPlans()
api.subscriptions.subscribe(planId)

// Referrals
api.referral.getCode()
api.referral.apply(code)
```

---

## ✅ **CHECKLIST:**

- [ ] Backend running on port 5001
- [ ] Copied PIKKAR_API_CLIENT.js to pikkar/src/services/api.js
- [ ] Installed axios
- [ ] Updated API_URL for your environment
- [ ] Tested connection with health endpoint
- [ ] Imported api in components
- [ ] Tested fetch vehicles
- [ ] Tested login
- [ ] Ready to integrate all features!

---

## 🎉 **YOU'RE READY!**

Your Pikkar frontend is now connected to the backend! Start building features:

1. **User App:** Book rides, send parcels, payments
2. **Driver App:** Accept rides, subscriptions, earnings
3. **Both:** Real-time tracking, notifications, wallet

**Need help with a specific feature? Ask me!** 🚀

