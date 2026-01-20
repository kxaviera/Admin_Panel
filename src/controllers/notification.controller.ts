import { Response } from 'express';
import User from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';
import { PushNotificationService } from '../services/push-notification.service';

export const registerDeviceToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body as { token?: string };

  if (!req.user?._id) {
    throw new AppError('Not authorized', 401);
  }
  if (!token) {
    throw new AppError('FCM token is required', 400);
  }

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { fcmTokens: token } });

  res.status(200).json({
    status: 'success',
    message: 'Device token registered',
  });
});

export const unregisterDeviceToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body as { token?: string };

  if (!req.user?._id) {
    throw new AppError('Not authorized', 401);
  }
  if (!token) {
    throw new AppError('FCM token is required', 400);
  }

  await User.findByIdAndUpdate(req.user._id, { $pull: { fcmTokens: token } });

  res.status(200).json({
    status: 'success',
    message: 'Device token removed',
  });
});

export const sendTestPushToMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, body } = req.body as { title?: string; body?: string };

  if (!req.user?._id) {
    throw new AppError('Not authorized', 401);
  }

  const user = await User.findById(req.user._id).select('fcmTokens');
  const tokens = (user as any)?.fcmTokens as string[] | undefined;

  if (!tokens?.length) {
    throw new AppError('No device tokens registered for this user', 400);
  }

  await PushNotificationService.sendToMultipleDevices(tokens, title || 'Test', body || 'Hello from Pikkar', {
    type: 'test',
  });

  res.status(200).json({
    status: 'success',
    message: 'Test push sent',
  });
});

