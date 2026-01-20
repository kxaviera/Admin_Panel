import { Router } from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  requestRefund,
  getPaymentHistory,
  getMyPaymentsList,
  getPaymentById,
  getPaymentStats,
} from '../controllers/payment.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Webhook route (no auth - verified by Stripe signature)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.post('/:id/refund', requestRefund);
// Mobile client convenience endpoint (returns a plain array)
router.get('/my-payments', getMyPaymentsList);
router.get('/', getPaymentHistory);
router.get('/stats', restrictTo('admin'), getPaymentStats);
router.get('/:id', getPaymentById);

export default router;

