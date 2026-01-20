import { Response } from 'express';
import bcrypt from 'bcryptjs';
import FleetManager from '../models/FleetManager';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

function genEmployeeId(prefix: string) {
  return `${prefix}${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
}

export const getFleetManagers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { employeeId: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    FleetManager.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'),
    FleetManager.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      fleetManagers: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getFleetManagerById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FleetManager.findById(req.params.id).select('-password');
  if (!doc) throw new AppError('Fleet manager not found', 404);
  res.status(200).json({ status: 'success', data: { fleetManager: doc } });
});

export const createFleetManager = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    company,
    zone,
    permissions,
    status,
    employeeId,
  } = req.body || {};

  if (!firstName || !lastName || !email || !phone) throw new AppError('firstName, lastName, email, phone are required', 400);

  const rawPass = password && String(password).length >= 6 ? String(password) : 'Fleet@123456';
  const hashed = await bcrypt.hash(rawPass, 12);

  const doc = await FleetManager.create({
    firstName,
    lastName,
    email,
    phone,
    password: hashed,
    company,
    zone,
    permissions: Array.isArray(permissions) ? permissions : [],
    status: status || 'active',
    employeeId: employeeId || genEmployeeId('FM'),
    managedVehicles: [],
    managedDrivers: [],
  });

  res.status(201).json({
    status: 'success',
    data: { fleetManager: await FleetManager.findById(doc._id).select('-password') },
  });
});

export const updateFleetManager = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const update: any = { ...req.body };
  delete update.password;

  const doc = await FleetManager.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).select('-password');
  if (!doc) throw new AppError('Fleet manager not found', 404);
  res.status(200).json({ status: 'success', data: { fleetManager: doc } });
});

export const resetFleetManagerPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body || {};
  const rawPass = password && String(password).length >= 6 ? String(password) : 'Fleet@123456';
  const hashed = await bcrypt.hash(rawPass, 12);

  const doc = await FleetManager.findByIdAndUpdate(req.params.id, { $set: { password: hashed } }, { new: true }).select('-password');
  if (!doc) throw new AppError('Fleet manager not found', 404);
  res.status(200).json({ status: 'success', message: 'Password reset', data: { fleetManager: doc } });
});

export const deleteFleetManager = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FleetManager.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Fleet manager not found', 404);
  res.status(200).json({ status: 'success', message: 'Fleet manager deleted' });
});

