import { Router } from 'express';
import { body } from 'express-validator';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import { getFirebaseConfigStatus, updateFirebaseConfig } from '../controllers/config.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/firebase', getFirebaseConfigStatus);
router.post(
  '/firebase',
  validate([
    body('projectId').notEmpty().withMessage('projectId is required'),
    body('clientEmail').notEmpty().withMessage('clientEmail is required'),
    body('privateKey').notEmpty().withMessage('privateKey is required'),
  ]),
  updateFirebaseConfig
);

export default router;

