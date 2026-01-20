import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getDriverApplications } from '../controllers/driverApplication.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getDriverApplications);

export default router;

