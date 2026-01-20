import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getZones } from '../controllers/zone.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getZones);

export default router;

