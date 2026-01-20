import { Response } from 'express';
import FleetVehicle from '../models/FleetVehicle';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const getFleetVehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.vehicleType) filter.vehicleType = String(req.query.vehicleType);

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { fleetNumber: { $regex: q, $options: 'i' } },
      { vehicleNumber: { $regex: q, $options: 'i' } },
      { make: { $regex: q, $options: 'i' } },
      { model: { $regex: q, $options: 'i' } },
      { color: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    FleetVehicle.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedDriver', 'vehicleNumber status userId')
      .populate('fleetManager', 'firstName lastName email employeeId'),
    FleetVehicle.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: { fleetVehicles: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const getFleetVehicleById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FleetVehicle.findById(req.params.id)
    .populate('assignedDriver', 'vehicleNumber status userId')
    .populate('fleetManager', 'firstName lastName email employeeId');
  if (!doc) throw new AppError('Fleet vehicle not found', 404);
  res.status(200).json({ status: 'success', data: { fleetVehicle: doc } });
});

export const createFleetVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    fleetNumber,
    vehicleNumber,
    make,
    model,
    year,
    color,
    vehicleType,
    assignedDriver,
    fleetManager,
    status,
    documents,
    insurance,
    maintenance,
    features,
    images,
  } = req.body || {};

  if (!fleetNumber || !vehicleNumber || !make || !model || !year || !color || !vehicleType) {
    throw new AppError('fleetNumber, vehicleNumber, make, model, year, color, vehicleType are required', 400);
  }

  const doc = await FleetVehicle.create({
    fleetNumber,
    vehicleNumber,
    make,
    model,
    year,
    color,
    vehicleType,
    assignedDriver,
    fleetManager,
    status: status || 'available',
    documents: documents || {},
    insurance: insurance || {},
    maintenance: maintenance || {},
    features: Array.isArray(features) ? features : [],
    images: Array.isArray(images) ? images : [],
  });

  res.status(201).json({ status: 'success', data: { fleetVehicle: doc } });
});

export const updateFleetVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FleetVehicle.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!doc) throw new AppError('Fleet vehicle not found', 404);
  res.status(200).json({ status: 'success', data: { fleetVehicle: doc } });
});

export const deleteFleetVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FleetVehicle.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Fleet vehicle not found', 404);
  res.status(200).json({ status: 'success', message: 'Fleet vehicle deleted' });
});

