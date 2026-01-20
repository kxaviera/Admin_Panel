import { Router } from 'express';
import { body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import {
  createParcel,
  getParcels,
  getAvailableParcels,
  getParcelById,
  acceptParcel,
  pickupParcel,
  markParcelInTransit,
  deliverParcel,
  cancelParcel,
  rateParcel,
} from '../controllers/parcel.controller';
import { checkSubscription } from '../middleware/subscriptionCheck';
import { requireParcelDriver } from '../middleware/bikeOnly';

const router = Router();

router.use(protect);

// Driver discovery of available parcel jobs
router.get('/available', restrictTo('driver'), requireParcelDriver, getAvailableParcels);

// Create parcel order
router.post(
  '/',
  restrictTo('user'),
  validate([
    body('pickupLocation.coordinates').isArray({ min: 2, max: 2 }),
    body('pickupLocation.address').notEmpty(),
    body('dropoffLocation.coordinates').isArray({ min: 2, max: 2 }),
    body('dropoffLocation.address').notEmpty(),
    body('parcelDetails.weight').isFloat({ gt: 0 }),
    body('parcelDetails.description').notEmpty(),
    body('parcelDetails.category').notEmpty(),
    body('senderInfo.name').notEmpty(),
    body('senderInfo.phone').notEmpty(),
    body('recipientInfo.name').notEmpty(),
    body('recipientInfo.phone').notEmpty(),
    body('fare').isFloat({ gt: 0 }),
    body('paymentMethod').isIn(['cash', 'card', 'wallet']),
  ]),
  createParcel
);

// List parcels (role scoped)
router.get('/', getParcels);

// Parcel details (role scoped) - keep before driver actions on :id
router.get('/:id', getParcelById);

// Driver actions
// Subscription is required to accept new jobs.
router.put('/:id/accept', restrictTo('driver'), requireParcelDriver, checkSubscription, acceptParcel);
// Allow completing an already-accepted job even if subscription expires mid-job.
router.put('/:id/pickup', restrictTo('driver'), pickupParcel);
router.put('/:id/in-transit', restrictTo('driver'), markParcelInTransit);
router.put('/:id/deliver', restrictTo('driver'), deliverParcel);

// Cancel (user/driver/admin)
router.put('/:id/cancel', cancelParcel);

// Rate (user)
router.post('/:id/rate', restrictTo('user'), rateParcel);

export default router;

