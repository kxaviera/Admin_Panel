import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Dispatcher from '../models/Dispatcher';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

function genEmployeeId(prefix: string) {
  return `${prefix}${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
}

export const getDispatchers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.zone) filter.zone = String(req.query.zone);

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { employeeId: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Dispatcher.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').populate('zone', 'name code'),
    Dispatcher.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: { dispatchers: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const getDispatcherById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Dispatcher.findById(req.params.id).select('-password').populate('zone', 'name code');
  if (!doc) throw new AppError('Dispatcher not found', 404);
  res.status(200).json({ status: 'success', data: { dispatcher: doc } });
});

export const createDispatcher = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, email, phone, password, zone, permissions, status, employeeId, shift } = req.body || {};
  if (!firstName || !lastName || !email || !phone) throw new AppError('firstName, lastName, email, phone are required', 400);

  const rawPass = password && String(password).length >= 6 ? String(password) : 'Dispatcher@123456';
  const hashed = await bcrypt.hash(rawPass, 12);

  const doc = await Dispatcher.create({
    firstName,
    lastName,
    email,
    phone,
    password: hashed,
    zone,
    permissions: Array.isArray(permissions) ? permissions : [],
    status: status || 'active',
    employeeId: employeeId || genEmployeeId('DP'),
    shift: shift || undefined,
  });

  res.status(201).json({
    status: 'success',
    data: { dispatcher: await Dispatcher.findById(doc._id).select('-password').populate('zone', 'name code') },
  });
});

export const updateDispatcher = asyncHandler(async (req: AuthRequest, res: Response) => {
  const update: any = { ...req.body };
  delete update.password;
  const doc = await Dispatcher.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true })
    .select('-password')
    .populate('zone', 'name code');
  if (!doc) throw new AppError('Dispatcher not found', 404);
  res.status(200).json({ status: 'success', data: { dispatcher: doc } });
});

export const resetDispatcherPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body || {};
  const rawPass = password && String(password).length >= 6 ? String(password) : 'Dispatcher@123456';
  const hashed = await bcrypt.hash(rawPass, 12);
  const doc = await Dispatcher.findByIdAndUpdate(req.params.id, { $set: { password: hashed } }, { new: true })
    .select('-password')
    .populate('zone', 'name code');
  if (!doc) throw new AppError('Dispatcher not found', 404);
  res.status(200).json({ status: 'success', message: 'Password reset', data: { dispatcher: doc } });
});

export const deleteDispatcher = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Dispatcher.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Dispatcher not found', 404);
  res.status(200).json({ status: 'success', message: 'Dispatcher deleted' });
});

