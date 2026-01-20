import { Router } from 'express';
import { body } from 'express-validator';
import {
  requestRide,
  getAvailableRides,
  getAllRides,
  getRideById,
  acceptRide,
  updateRideStatus,
  cancelRide,
  rateRide,
  getRideStats,
} from '../controllers/ride.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import { checkSubscription } from '../middleware/subscriptionCheck';
import { requireRideDriver } from '../middleware/bikeOnly';
import Service from '../models/Service';

const router = Router();

// All routes require authentication
router.use(protect);

// Available ride requests (driver discovery) - keep before /:id
router.get('/available', restrictTo('driver'), requireRideDriver, getAvailableRides);

// Ride request validation
const rideRequestValidation = [
  body('pickupLocation.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Valid pickup coordinates are required'),
  body('pickupLocation.address')
    .notEmpty()
    .withMessage('Pickup address is required'),
  body('dropoffLocation.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Valid dropoff coordinates are required'),
  body('dropoffLocation.address')
    .notEmpty()
    .withMessage('Dropoff address is required'),
  body('vehicleType')
    .custom(async (value) => {
      const vt = String(value || '').toLowerCase().trim();
      const ok = await Service.exists({ category: 'ride', isActive: true, vehicleType: vt });
      if (!ok) throw new Error('Valid vehicle type is required');
      return true;
    }),
  body('paymentMethod')
    .isIn(['cash', 'card', 'wallet', 'upi'])
    .withMessage('Valid payment method is required'),
];

// Rating validation
const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString(),
];

// Routes
// NOTE: Admins get global stats; users/drivers get their own stats.
router.get('/stats', getRideStats);
router.post('/', restrictTo('user'), validate(rideRequestValidation), requestRide);
router.get('/', getAllRides);
router.get('/:id', getRideById);
router.put('/:id/accept', restrictTo('driver'), requireRideDriver, checkSubscription, acceptRide);
// Allow drivers to complete an already-accepted ride even if subscription expires mid-ride.
router.put('/:id/status', restrictTo('driver'), updateRideStatus);
router.put('/:id/cancel', cancelRide);
router.put('/:id/rate', validate(ratingValidation), rateRide);
// Backward compatibility (some clients use POST for rating)
router.post('/:id/rate', validate(ratingValidation), rateRide);

export default router;

