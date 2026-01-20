import { Router } from 'express';
import {
  getDashboardOverview,
  getRideAnalytics,
  getRevenueAnalytics,
  getDriverPerformance,
  getMarketingAnalytics,
} from '../controllers/analytics.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/dashboard', getDashboardOverview);
router.get('/rides', getRideAnalytics);
router.get('/revenue', getRevenueAnalytics);
router.get('/driver-performance', getDriverPerformance);
router.get('/marketing', getMarketingAnalytics);

export default router;

