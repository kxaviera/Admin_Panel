import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPromoCode,
  getAllPromoCodes,
  validatePromoCode,
  applyPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoStats,
  getMyPromoUsage,
  getAvailablePromoCodes,
} from '../controllers/promo.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';

const router = Router();

router.use(protect);

// Validation
const createPromoValidation = [
  body('code').trim().notEmpty().withMessage('Promo code is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('discountType')
    .isIn(['percentage', 'fixed'])
    .withMessage('Valid discount type is required'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Valid discount value is required'),
  body('validFrom').isISO8601().withMessage('Valid from date is required'),
  body('validUntil').isISO8601().withMessage('Valid until date is required'),
  body('usageLimit')
    .isInt({ min: 1 })
    .withMessage('Valid usage limit is required'),
];

const validatePromoValidation = [
  body('code').trim().notEmpty().withMessage('Promo code is required'),
  // Optional for "code-only" validation used by some apps
  body('rideAmount').optional().isFloat({ min: 0 }),
  body('amount').optional().isFloat({ min: 0 }),
  body('vehicleType').optional().isIn(['sedan', 'suv', 'auto', 'bike', 'luxury']),
];

// User routes
router.get('/available', getAvailablePromoCodes);
router.post('/validate', validate(validatePromoValidation), validatePromoCode);
router.post('/apply', applyPromoCode);
router.get('/my-usage', getMyPromoUsage);

// Admin routes
router.post('/', restrictTo('admin'), validate(createPromoValidation), createPromoCode);
router.get('/', restrictTo('admin'), getAllPromoCodes);
router.get('/stats', restrictTo('admin'), getPromoStats);
router.put('/:id', restrictTo('admin'), updatePromoCode);
router.delete('/:id', restrictTo('admin'), deletePromoCode);

export default router;

