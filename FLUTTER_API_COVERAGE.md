## Flutter ↔ Backend API coverage (User + Driver apps)

This is a quick “what is actually wired” map between the backend routes in `src/routes/*` and the Flutter apps in `external-apps/`.

### Authentication (OTP-only)

- **Backend**: `POST /api/v1/auth/firebase` (Firebase idToken → backend JWTs)
  - **User app**: `external-apps/pikkar-user/lib/core/services/auth_api_service.dart` → `firebaseLogin()`
  - **User app (wrapper)**: `external-apps/pikkar-user/lib/core/services/integrated_auth_service.dart` → `loginWithFirebaseIdToken()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/auth_service.dart` → `loginWithFirebase()`

- **Backend**: `GET /api/v1/auth/me`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/auth_service.dart` → `getCurrentUser()`

- **Backend**: `POST /api/v1/auth/refresh-token`
  - **User app**: `external-apps/pikkar-user/lib/core/services/auth_api_service.dart` → `refreshToken()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/auth_service.dart` → `refreshToken()`

- **Backend**: `POST /api/v1/auth/logout`
  - **User app**: `external-apps/pikkar-user/lib/core/services/auth_api_service.dart` → `logout()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/auth_service.dart` → `logout()`

Notes:
- Email/password auth methods were removed/disabled in Flutter (OTP-only requirement). Backend may still expose them for admin.

### Rides

- **Backend**: `POST /api/v1/rides` (user)
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `create()`

- **Backend**: `GET /api/v1/rides` (role-scoped list)
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `getAll() / getMyRides()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `getRides()`

- **Backend**: `GET /api/v1/rides/available` (driver discovery)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `getAvailableRides()`

- **Backend**: `GET /api/v1/rides/:id`
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `getById()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `getRideById()`

- **Backend**: `PUT /api/v1/rides/:id/accept` (driver)
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `accept()` (driver-only use)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `acceptRide()`

- **Backend**: `PUT /api/v1/rides/:id/status` (driver; includes OTP for start)
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `updateStatus()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `updateRideStatus()`

- **Backend**: `PUT /api/v1/rides/:id/cancel`
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `cancel()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `cancelRide()`

- **Backend**: `PUT|POST /api/v1/rides/:id/rate`
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `rate()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `rateRide()`

- **Backend**: `GET /api/v1/rides/stats`
  - **User app**: `external-apps/pikkar-user/lib/core/services/ride_api_service.dart` → `getStats()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/ride_service.dart` → `getRideStats()`

### Parcels

- **Backend**: `POST /api/v1/parcels` (user)
  - **User app**: `external-apps/pikkar-user/lib/core/services/parcel_api_service.dart` → `create()`

- **Backend**: `GET /api/v1/parcels` (role-scoped list)
  - **User app**: `external-apps/pikkar-user/lib/core/services/parcel_api_service.dart` → `getAll()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `getMyParcels()`

- **Backend**: `GET /api/v1/parcels/available` (driver discovery)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `getAvailableParcels()`

- **Backend**: `GET /api/v1/parcels/:id`
  - **User app**: `external-apps/pikkar-user/lib/core/services/parcel_api_service.dart` → `getById()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `getById()`

- **Backend**: `PUT /api/v1/parcels/:id/accept` (driver)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `acceptParcel()`

- **Backend**: `PUT /api/v1/parcels/:id/pickup` (driver; pickup OTP)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `pickupParcel()`

- **Backend**: `PUT /api/v1/parcels/:id/in-transit` (driver)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `markInTransit()`

- **Backend**: `PUT /api/v1/parcels/:id/deliver` (driver; delivery OTP)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/parcel_service.dart` → `deliverParcel()`

- **Backend**: `PUT /api/v1/parcels/:id/cancel`
  - **User app**: `external-apps/pikkar-user/lib/core/services/parcel_api_service.dart` → `cancel()`

### Drivers / Profiles / Location

- **Backend**: `GET /api/v1/drivers/nearby` (public)
  - **User app**: `external-apps/pikkar-user/lib/core/services/driver_api_service.dart` → `getNearby()`

- **Backend**: `GET /api/v1/drivers/:id`
  - **User app**: `external-apps/pikkar-user/lib/core/services/driver_api_service.dart` → `getById()`

- **Backend**: `POST /api/v1/drivers/register` (driver)
  - **User app**: `external-apps/pikkar-user/lib/core/services/driver_api_service.dart` → `register()`

- **Backend**: `PUT /api/v1/drivers/location` (driver)
  - **User app**: `external-apps/pikkar-user/lib/core/services/driver_api_service.dart` → `updateLocation()`

- **Backend**: `PUT /api/v1/drivers/toggle-online` (driver)
  - **User app**: `external-apps/pikkar-user/lib/core/services/driver_api_service.dart` → `toggleOnline()`

- **Backend**: `GET /api/v1/drivers/me` (driver)
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/auth_service.dart` → `getCurrentDriver()`

### Users (profile + location)

- **Backend**: `PUT /api/v1/users/profile`
  - **User app**: `external-apps/pikkar-user/lib/core/services/user_api_service.dart` → `update()`

- **Backend**: `PUT /api/v1/users/location`
  - **User app**: `external-apps/pikkar-user/lib/core/services/user_api_service.dart` → `updateLocation()`

### Vehicles + Pricing

- **Backend**: `GET /api/v1/vehicle-types/active`
  - **User app**: `external-apps/pikkar-user/lib/core/services/vehicle_api_service.dart` → `VehicleTypesApiService.getActive()`

- **Backend**: `POST /api/v1/vehicle-types/calculate-fare`
  - **User app**: `external-apps/pikkar-user/lib/core/services/vehicle_api_service.dart` → `calculateFare()`

- **Backend**: `GET /api/v1/parcel-vehicles/active`
  - **User app**: `external-apps/pikkar-user/lib/core/services/vehicle_api_service.dart` → `ParcelVehiclesApiService.getActive()`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/vehicle_service.dart` → `getDeliveryVehicles()` (uses `/parcel-vehicles/active`)

- **Backend**: `GET /api/v1/parcel-vehicles/find-suitable`
  - **User app**: `external-apps/pikkar-user/lib/core/services/vehicle_api_service.dart` → `findSuitable()`

- **Backend**: `POST /api/v1/parcel-vehicles/calculate-price`
  - **User app**: `external-apps/pikkar-user/lib/core/services/vehicle_api_service.dart` → `calculatePrice()`

### Payments + Wallet

- **Backend**: `POST /api/v1/payments/create-intent`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `createIntent()`

- **Backend**: `POST /api/v1/payments/confirm`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `confirm()`

- **Backend**: `GET /api/v1/payments/my-payments`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `getHistory()`

- **Backend**: `POST /api/v1/payments/:id/refund`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `requestRefund()`

- **Backend**: `GET /api/v1/wallet/balance`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `WalletApiService.getBalance()`

- **Backend**: `POST /api/v1/wallet/add-money` (alias of `/top-up`)
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `WalletApiService.addMoney()`

- **Backend**: `GET /api/v1/wallet/transactions`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `WalletApiService.getTransactions()`

- **Backend**: `POST /api/v1/wallet/withdraw`
  - **User app**: `external-apps/pikkar-user/lib/core/services/payment_api_service.dart` → `WalletApiService.withdraw()`

### Promo + Referral

- **Backend**: `GET /api/v1/promo/available`
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `getAvailable()`

- **Backend**: `POST /api/v1/promo/validate`
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `validate()`

- **Backend**: `POST /api/v1/promo/apply`
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `apply()`

- **Backend**: `GET /api/v1/referral/my-code`
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `ReferralApiService.getCode()`

- **Backend**: `POST /api/v1/referral/apply`
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `ReferralApiService.apply()`

- **Backend**: `GET /api/v1/referral/stats` (role-aware stats)
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `ReferralApiService.getStats()`

- **Backend**: `GET /api/v1/referral/history`
  - **User app**: `external-apps/pikkar-user/lib/core/services/promo_api_service.dart` → `ReferralApiService.getHistory()`

### Subscriptions (Driver)

- **Backend**: `GET /api/v1/subscriptions/ui`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/subscription_service.dart` → `getUi()`
  - **Driver app UI**: `external-apps/pikkar-driver/lib/driver/menu/subscription_screen.dart`

- **Backend**: `POST /api/v1/subscriptions/subscribe`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/subscription_service.dart` → `subscribe()`

- **Backend**: `POST /api/v1/subscriptions/cancel`
  - **Driver app**: `external-apps/pikkar-driver/lib/core/services/subscription_service.dart` → `cancel()`

### Uploads

- **Backend**: `POST /api/v1/upload/profile` (mobile alias)
  - **User app**: `external-apps/pikkar-user/lib/core/services/user_api_service.dart` → `uploadPicture()`

