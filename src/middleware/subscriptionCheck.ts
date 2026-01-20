import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import Driver from '../models/Driver.model';
import { SubscriptionService } from '../services/subscription.service';
import { AppError } from '../utils/AppError';

/**
 * Middleware to check if driver has valid subscription before accepting rides
 */
export const checkSubscription = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Only check for drivers
    if (req.user.role !== 'driver') {
      return next();
    }

    // Get driver profile
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      return next(new AppError('Driver profile not found', 404));
    }

    // Check if driver has valid subscription
    const hasValidSubscription = await SubscriptionService.hasValidSubscription(
      driver._id
    );

    if (!hasValidSubscription) {
      return next(
        new AppError(
          'You need an active subscription to accept rides. Please subscribe to a plan.',
          403
        )
      );
    }

    next();
  } catch (error: any) {
    next(error);
  }
};

