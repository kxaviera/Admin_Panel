import { NextFunction, Response } from 'express';
import Driver from '../models/Driver.model';
import { AppError } from '../utils/AppError';
import { AuthRequest } from './auth.middleware';
import Service from '../models/Service';

/**
 * Enforce job eligibility:
 * - Bike drivers can accept BOTH ride + parcel jobs.
 * - Other ride vehicles can accept ONLY ride jobs.
 * - Other parcel vehicles can accept ONLY parcel jobs.
 *
 * We derive "ride-capable" vs "parcel-capable" from Service collection.
 */
export const requireRideDriver = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== 'driver') return next();

    const driver = await Driver.findOne({ userId: req.user._id }).select(
      'vehicleType'
    );
    if (!driver) return next(new AppError('Driver profile not found', 404));

    const vt = String(driver.vehicleType || '').toLowerCase().trim();
    const ok = await Service.exists({
      category: 'ride',
      isActive: true,
      vehicleType: vt,
    });
    if (!ok) return next(new AppError('You are not eligible to accept ride jobs.', 403));

    return next();
  } catch (err: any) {
    return next(err);
  }
};

export const requireParcelDriver = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== 'driver') return next();

    const driver = await Driver.findOne({ userId: req.user._id }).select(
      'vehicleType'
    );
    if (!driver) return next(new AppError('Driver profile not found', 404));

    const vt = String(driver.vehicleType || '').toLowerCase().trim();
    // Bike is allowed for parcel jobs too (if bike parcel service exists, this will pass anyway).
    const ok = await Service.exists({
      category: 'parcel',
      isActive: true,
      vehicleType: vt,
    });
    if (!ok) return next(new AppError('You are not eligible to accept parcel jobs.', 403));

    return next();
  } catch (err: any) {
    return next(err);
  }
};

