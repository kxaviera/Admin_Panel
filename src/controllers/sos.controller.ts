import { Response } from 'express';
import SOS from '../models/SOS';
import Driver from '../models/Driver.model';
import Ride from '../models/Ride.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

// Create SOS (user/driver)
export const createSOS = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authorized', 401);

  const {
    rideId,
    priority,
    reason,
    description,
    location,
    emergencyServices,
    images,
    audioRecording,
    notes,
  } = req.body || {};

  if (!reason || String(reason).trim().length === 0) {
    throw new AppError('reason is required', 400);
  }

  const coords = location?.coordinates;
  if (!location || !Array.isArray(coords) || coords.length !== 2) {
    throw new AppError('location.coordinates [lng,lat] is required', 400);
  }

  let driverId: any = undefined;
  let driverPhone: string | undefined = undefined;

  // If a ride is provided, attempt to link driver details
  if (rideId) {
    const ride = await Ride.findById(String(rideId));
    if (ride?.driverId) {
      driverId = ride.driverId;
      const driverProfile = await Driver.findById(ride.driverId).populate('userId', 'phone');
      driverPhone = (driverProfile as any)?.userId?.phone;
    }
  }

  // If SOS is created by a driver (role=driver), link driver profile
  if (req.user.role === 'driver') {
    const driverProfile = await Driver.findOne({ userId: req.user._id });
    if (driverProfile) {
      driverId = driverProfile._id;
      driverPhone = req.user.phone;
    }
  }

  const doc = await SOS.create({
    userId: req.user._id,
    driverId,
    rideId: rideId || undefined,
    priority: priority || 'medium',
    status: 'active',
    reason: String(reason).trim(),
    description: description ? String(description) : undefined,
    location: {
      type: 'Point',
      coordinates: [Number(coords[0]), Number(coords[1])],
      address: location?.address ? String(location.address) : undefined,
    },
    userPhone: req.user.phone || 'unknown',
    driverPhone,
    emergencyServices: emergencyServices || {},
    notes,
    audioRecording,
    images,
  });

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to('role:admin').emit('sos:new', doc);
  }

  res.status(201).json({
    status: 'success',
    data: { sos: doc },
  });
});

// Admin: list SOS alerts
export const getAllSOS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.priority) filter.priority = String(req.query.priority);

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { reason: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { userPhone: { $regex: q, $options: 'i' } },
      { driverPhone: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    SOS.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName phone')
      .populate({
        path: 'driverId',
        populate: { path: 'userId', select: 'firstName lastName phone' },
      })
      .populate('rideId', 'status pickupLocation dropoffLocation'),
    SOS.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      sos: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getSOSById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await SOS.findById(req.params.id)
    .populate('userId', 'firstName lastName phone')
    .populate({
      path: 'driverId',
      populate: { path: 'userId', select: 'firstName lastName phone' },
    })
    .populate('rideId', 'status pickupLocation dropoffLocation');

  if (!doc) throw new AppError('SOS not found', 404);

  res.status(200).json({ status: 'success', data: { sos: doc } });
});

// Admin: update status and actions
export const updateSOSStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, notes, emergencyServices } = req.body || {};
  const nextStatus = String(status || '').trim();
  const allowed = ['active', 'responded', 'resolved', 'cancelled'];
  if (!allowed.includes(nextStatus)) throw new AppError('Invalid status', 400);

  const doc: any = await SOS.findById(req.params.id);
  if (!doc) throw new AppError('SOS not found', 404);

  doc.status = nextStatus;
  if (typeof notes === 'string') doc.notes = notes;
  if (emergencyServices && typeof emergencyServices === 'object') {
    doc.emergencyServices = { ...doc.emergencyServices, ...emergencyServices };
  }

  if (nextStatus === 'responded') {
    doc.respondedBy = req.user?._id;
    doc.respondedAt = new Date();
  }
  if (nextStatus === 'resolved') {
    doc.resolvedBy = req.user?._id;
    doc.resolvedAt = new Date();
  }

  await doc.save();

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to('role:admin').emit('sos:status:update', doc);
  }

  res.status(200).json({ status: 'success', data: { sos: doc } });
});

