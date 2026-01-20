import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
  subscribeToPlan,
  getMySubscription,
  getActiveSubscription,
  getSubscriptionUi,
  getSubscriptionHistory,
  cancelSubscription,
  cancelMyActiveSubscription,
  renewSubscription,
  toggleAutoRenew,
  getAllSubscriptions,
  getSubscriptionStatsForCaller,
  checkSubscriptionValidity,
} from '../controllers/subscription.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/plans', getAllPlans);

// Protected routes
router.use(protect);

// Admin-only: include inactive plans too
router.get('/plans/admin', restrictTo('admin'), getAllPlansAdmin);

// Plan validation
const createPlanValidation = [
  body('name').trim().notEmpty().withMessage('Plan name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('duration')
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .withMessage('Valid duration is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Valid price is required'),
];

const subscribeValidation = [
  body('planId').optional().isString(),
  body('planCode').optional().isString(),
  body('paymentMethod')
    .isIn(['wallet', 'card', 'upi', 'cash'])
    .withMessage('Valid payment method is required'),
];

// Driver routes
router.post('/subscribe', restrictTo('driver'), validate(subscribeValidation), subscribeToPlan);
router.get('/my-subscription', restrictTo('driver'), getMySubscription);
// Legacy aliases used by some mobile clients
router.get('/active', restrictTo('driver'), getActiveSubscription);
router.post('/cancel', restrictTo('driver'), cancelMyActiveSubscription);
router.get('/ui', restrictTo('driver'), getSubscriptionUi);
router.get('/history', restrictTo('driver'), getSubscriptionHistory);
router.post('/renew', restrictTo('driver'), renewSubscription);
router.put('/:id/cancel', restrictTo('driver'), cancelSubscription);
router.put('/:id/auto-renew', restrictTo('driver'), toggleAutoRenew);
router.get('/check-validity', restrictTo('driver'), checkSubscriptionValidity);

// Admin routes
router.post('/plans', restrictTo('admin'), validate(createPlanValidation), createPlan);
router.put('/plans/:id', restrictTo('admin'), updatePlan);
router.delete('/plans/:id', restrictTo('admin'), deletePlan);
router.get('/', restrictTo('admin'), getAllSubscriptions);
// NOTE: Admins get global stats; drivers get self snapshot.
router.get('/stats', getSubscriptionStatsForCaller);

export default router;

