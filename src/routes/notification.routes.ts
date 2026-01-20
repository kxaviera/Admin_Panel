import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';
import {
  registerDeviceToken,
  unregisterDeviceToken,
  sendTestPushToMe,
} from '../controllers/notification.controller';

const router = Router();

const tokenValidation = [body('token').notEmpty().withMessage('FCM token is required')];

router.post('/device-token', protect, validate(tokenValidation), registerDeviceToken);
router.delete('/device-token', protect, validate(tokenValidation), unregisterDeviceToken);
router.post('/test', protect, sendTestPushToMe);

export default router;

