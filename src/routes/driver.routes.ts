import { Router } from 'express';
import { body } from 'express-validator';
import {
  applyToBeDriver,
  registerDriver,
  getAllDrivers,
  getDriverById,
  getMyDriverProfile,
  updateDriver,
  updateDriverLocation,
  toggleOnlineStatus,
  verifyDriver,
  getNearbyDrivers,
  getDriverStats,
  getDriversMap,
  getDriverHeatmap,
} from '../controllers/driver.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import { checkSubscription } from '../middleware/subscriptionCheck';
import Service from '../models/Service';
import { upload } from '../services/upload.service';

const router = Router();

// Public routes (used by rider app before/without auth)
router.get('/nearby', getNearbyDrivers);
// Apply to be driver with file uploads support
// Middleware to set folder for uploads
router.post(
  '/apply',
  (req, res, next) => {
    // Set folder to 'documents' for driver application uploads
    req.body.folder = 'documents';
    next();
  },
  upload.fields([
    { name: 'rcFront', maxCount: 1 },
    { name: 'rcBack', maxCount: 1 },
    { name: 'aadharFront', maxCount: 1 },
    { name: 'aadharBack', maxCount: 1 },
    { name: 'dlFront', maxCount: 1 },
    { name: 'dlBack', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  applyToBeDriver
);

// All other routes require authentication
router.use(protect);

// Driver registration validation
const driverRegistrationValidation = [
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('licenseExpiry').isISO8601().withMessage('Valid license expiry date is required'),
  body('vehicleType')
    .custom(async (value) => {
      const vt = String(value || '').toLowerCase().trim();
      const ok = await Service.exists({
        isActive: true,
        category: { $in: ['ride', 'parcel'] },
        vehicleType: vt,
      });
      if (!ok) throw new Error('Valid vehicle type is required');
      return true;
    }),
  body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('vehicleMake').notEmpty().withMessage('Vehicle make is required'),
  body('vehicleYear')
    .isInt({ min: 2000 })
    .withMessage('Vehicle year must be 2000 or later'),
  body('vehicleColor').notEmpty().withMessage('Vehicle color is required'),
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
];

// Location validation
const locationValidation = [
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
];

// Routes
router.post('/register', validate(driverRegistrationValidation), registerDriver);
// NOTE: Admins get global stats; drivers get self stats.
router.get('/stats', getDriverStats);
router.get('/map', restrictTo('admin'), getDriversMap);
router.get('/heatmap', restrictTo('admin'), getDriverHeatmap);
router.get('/me', restrictTo('driver'), getMyDriverProfile);
router.get('/', restrictTo('admin'), getAllDrivers);
router.get('/:id', getDriverById);
router.put('/location', restrictTo('driver'), validate(locationValidation), updateDriverLocation);
router.put(
  '/toggle-online',
  restrictTo('driver'),
  checkSubscription,
  toggleOnlineStatus
);
router.put('/:id/verify', restrictTo('admin'), verifyDriver);
// Keep dynamic :id routes LAST to avoid conflicts (e.g. /location)
router.put('/:id', updateDriver);

export default router;

