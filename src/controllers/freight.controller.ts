import { Response } from 'express';
import Freight from '../models/Freight';
import Driver from '../models/Driver.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

function makeTrackingNumber() {
  return `FRT${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
}

// User: create freight order
export const createFreight = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authorized', 401);
  if (req.user.role !== 'user') throw new AppError('Only users can create freight orders', 403);

  const {
    pickupLocation,
    dropoffLocation,
    freightDetails,
    vehicleType,
    fare,
    paymentMethod,
    scheduledPickup,
    notes,
    documents,
    images,
  } = req.body || {};

  if (!pickupLocation?.coordinates || !dropoffLocation?.coordinates) {
    throw new AppError('pickupLocation.coordinates and dropoffLocation.coordinates are required', 400);
  }
  if (!freightDetails?.weight || !freightDetails?.volume) {
    throw new AppError('freightDetails.weight and freightDetails.volume are required', 400);
  }
  if (!vehicleType) throw new AppError('vehicleType is required', 400);
  if (fare === undefined || fare === null || !Number.isFinite(Number(fare))) {
    throw new AppError('fare is required', 400);
  }
  if (!paymentMethod) throw new AppError('paymentMethod is required', 400);

  const order = await Freight.create({
    userId: req.user._id,
    trackingNumber: makeTrackingNumber(),
    pickupLocation,
    dropoffLocation,
    freightDetails,
    vehicleType,
    status: 'pending',
    fare: Number(fare),
    paymentMethod,
    paymentStatus: 'pending',
    scheduledPickup: scheduledPickup ? new Date(scheduledPickup) : undefined,
    notes,
    documents,
    images,
  });

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to('role:driver').emit('freight:new', order);
  }

  res.status(201).json({ status: 'success', data: { freight: order } });
});

// Admin/User/Driver: list freight orders
export const getFreightOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (req.user?.role === 'user') {
    filter.userId = req.user._id;
  } else if (req.user?.role === 'driver') {
    const driver = await Driver.findOne({ userId: req.user._id });
    filter.driverId = driver?._id || null;
  }

  if (req.query.status) filter.status = String(req.query.status);

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { trackingNumber: { $regex: q, $options: 'i' } },
      { 'pickupLocation.address': { $regex: q, $options: 'i' } },
      { 'dropoffLocation.address': { $regex: q, $options: 'i' } },
      { 'pickupLocation.contact.name': { $regex: q, $options: 'i' } },
      { 'pickupLocation.contact.phone': { $regex: q, $options: 'i' } },
      { 'dropoffLocation.contact.name': { $regex: q, $options: 'i' } },
      { 'dropoffLocation.contact.phone': { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Freight.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName phone')
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'firstName lastName phone' },
      }),
    Freight.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      freight: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getFreightById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const order = await Freight.findById(req.params.id)
    .populate('userId', 'firstName lastName phone')
    .populate({
      path: 'driverId',
      populate: { path: 'userId', select: 'firstName lastName phone' },
    });
  if (!order) throw new AppError('Freight order not found', 404);

  // Authorization checks
  if (req.user?.role === 'user' && order.userId?.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }
  if (req.user?.role === 'driver') {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver || order.driverId?.toString() !== driver._id.toString()) throw new AppError('Not authorized', 403);
  }

  res.status(200).json({ status: 'success', data: { freight: order } });
});

// Admin: update freight status (simple management)
export const updateFreightStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body || {};
  const next = String(status || '').trim();
  const allowed = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
  if (!allowed.includes(next)) throw new AppError('Invalid status', 400);

  const order: any = await Freight.findById(req.params.id);
  if (!order) throw new AppError('Freight order not found', 404);

  order.status = next;
  if (next === 'picked_up') order.pickupTime = new Date();
  if (next === 'delivered') order.deliveryTime = new Date();
  if (next === 'cancelled') order.deliveryTime = order.deliveryTime || undefined;

  await order.save();

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to('role:admin').emit('freight:status:update', order);
  }

  res.status(200).json({ status: 'success', data: { freight: order } });
});

