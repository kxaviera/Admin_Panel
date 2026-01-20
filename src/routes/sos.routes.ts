import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { createSOS, getAllSOS, getSOSById, updateSOSStatus } from '../controllers/sos.controller';

const router = Router();

// User/Driver create SOS
router.post('/', protect, createSOS);

// Admin views/manages
router.use(protect, restrictTo('admin'));
router.get('/', getAllSOS);
router.get('/:id', getSOSById);
router.patch('/:id/status', updateSOSStatus);

export default router;

