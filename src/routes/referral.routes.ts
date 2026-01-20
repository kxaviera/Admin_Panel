import { Router } from 'express';
import {
  getMyReferralCode,
  applyReferralCode,
  getMyReferralStats,
  getMyReferralHistory,
  getAllReferrals,
  getReferralStats,
  updateReferralRewards,
} from '../controllers/referral.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

// User routes
router.get('/my-code', getMyReferralCode);
router.post('/apply', applyReferralCode);
router.get('/my-stats', getMyReferralStats);
router.get('/history', getMyReferralHistory);

// Admin routes
router.get('/', restrictTo('admin'), getAllReferrals);
// NOTE: Admins get global stats; others get self stats.
router.get('/stats', getReferralStats);
router.put('/rewards', restrictTo('admin'), updateReferralRewards);

export default router;

