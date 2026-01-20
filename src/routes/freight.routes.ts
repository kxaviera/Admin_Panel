import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { createFreight, getFreightOrders, getFreightById, updateFreightStatus } from '../controllers/freight.controller';

const router = Router();

// Create (user)
router.post('/', protect, restrictTo('user'), createFreight);

// List (admin + user + driver)
router.get('/', protect, getFreightOrders);
router.get('/:id', protect, getFreightById);

// Admin actions
router.patch('/:id/status', protect, restrictTo('admin'), updateFreightStatus);

export default router;

