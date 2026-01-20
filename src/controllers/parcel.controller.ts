import { Response } from 'express';
import Parcel from '../models/Parcel';
import Driver from '../models/Driver.model';
import Service from '../models/Service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { SMSService } from '../services/sms.service';

function sanitizeParcelForViewer(parcel: any, viewerRole: string) {
  const obj = typeof parcel?.toObject === 'function' ? parcel.toObject() : parcel;
  if (viewerRole !== 'user') {
    delete obj.pickupOtp;
    delete obj.deliveryOtp;
  }
  return obj;
}

function generateTrackingNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(100000 + Math.random() * 900000).toString();
  return `PKR-${ts}-${rnd}`;
}

// @desc    Create a parcel delivery order
// @route   POST /api/v1/parcels
// @access  Private/User
export const createParcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'user') throw new AppError('Only users can create parcel orders', 403);

  const {
    pickupLocation,
    dropoffLocation,
    parcelDetails,
    senderInfo,
    recipientInfo,
    fare,
    paymentMethod,
    scheduledPickup,
    notes,
  } = req.body;

  if (!pickupLocation || !dropoffLocation) throw new AppError('pickupLocation and dropoffLocation are required', 400);
  if (!parcelDetails) throw new AppError('parcelDetails is required', 400);
  if (!senderInfo || !recipientInfo) throw new AppError('senderInfo and recipientInfo are required', 400);
  if (typeof fare !== 'number' || !Number.isFinite(fare) || fare <= 0) throw new AppError('Valid fare is required', 400);
  if (!paymentMethod) throw new AppError('paymentMethod is required', 400);

  const trackingNumber = generateTrackingNumber();

  const parcel = await Parcel.create({
    userId: req.user._id,
    trackingNumber,
    pickupLocation,
    dropoffLocation,
    parcelDetails,
    senderInfo,
    recipientInfo,
    fare,
    paymentMethod,
    scheduledPickup,
    notes,
  });

  // Notify sender/recipient with OTPs (if Twilio configured)
  const senderPhone = senderInfo?.phone;
  const recipientPhone = recipientInfo?.phone;
  if (senderPhone) {
    await SMSService.sendSMS(
      senderPhone,
      `Pikkar Parcel ${trackingNumber}: Pickup OTP is ${parcel.pickupOtp}. Share this OTP with the driver at pickup.`
    );
  }
  if (recipientPhone) {
    await SMSService.sendSMS(
      recipientPhone,
      `Pikkar Parcel ${trackingNumber}: Delivery OTP is ${parcel.deliveryOtp}. Share this OTP with the driver at delivery.`
    );
  }

  const io = (req as any).app?.get?.('io');
  if (io) {
    const payload = sanitizeParcelForViewer(parcel, 'driver');
    // Notify only drivers within their configured radius, and eligible for parcel category.
    const eligibleVts = await Service.find({ category: 'parcel', isActive: true }).distinct('vehicleType');
    const pickupLng = Number(pickupLocation?.coordinates?.[0]);
    const pickupLat = Number(pickupLocation?.coordinates?.[1]);
    if (Number.isFinite(pickupLng) && Number.isFinite(pickupLat) && eligibleVts.length > 0) {
      const maxDistanceMeters = 50000; // hard ceiling (50km)
      const candidates = await Driver.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [pickupLng, pickupLat] },
            key: 'currentLocation',
            distanceField: 'distMeters',
            spherical: true,
            maxDistance: maxDistanceMeters,
            query: {
              isOnline: true,
              isAvailable: true,
              status: 'approved',
              currentRide: null,
              vehicleType: { $in: eligibleVts },
            },
          },
        },
        {
          $project: {
            userId: 1,
            distMeters: 1,
            searchRadiusKm: 1,
          },
        },
        { $limit: 250 },
      ]);

      for (const d of candidates) {
        const uid = d?.userId?.toString?.();
        if (!uid) continue;
        const radiusKm = Number(d?.searchRadiusKm ?? 5);
        const radiusMeters = Math.max(0.5, radiusKm) * 1000;
        const distMeters = Number(d?.distMeters ?? Number.POSITIVE_INFINITY);
        if (!Number.isFinite(distMeters) || distMeters > radiusMeters) continue;
        io.to(`user:${uid}`).emit('parcel:new', payload);
      }
    } else {
      // Fallback: broadcast to parcel-capable drivers
      io.to('role:driver:parcel').emit('parcel:new', payload);
    }
  }

  return res.status(201).json({
    status: 'success',
    message: 'Parcel order created successfully',
    data: { parcel: sanitizeParcelForViewer(parcel, 'user') },
  });
});

// @desc    List parcels (role-scoped)
// @route   GET /api/v1/parcels
// @access  Private
export const getParcels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.user.role === 'user') {
    filter.userId = req.user._id;
  } else if (req.user.role === 'driver') {
    const driver = await Driver.findOne({ userId: req.user._id });
    filter.driverId = driver?._id || null;
  } else if (req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.search) {
    const q = String(req.query.search).trim();
    if (q.length > 0) {
      filter.$or = [
        { trackingNumber: { $regex: q, $options: 'i' } },
        { 'senderInfo.name': { $regex: q, $options: 'i' } },
        { 'senderInfo.phone': { $regex: q, $options: 'i' } },
        { 'recipientInfo.name': { $regex: q, $options: 'i' } },
        { 'recipientInfo.phone': { $regex: q, $options: 'i' } },
      ];
    }
  }

  const parcels = await Parcel.find(filter)
    .populate('userId', 'firstName lastName phone')
    .populate({
      path: 'driverId',
      populate: { path: 'userId', select: 'firstName lastName phone' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Parcel.countDocuments(filter);
  const safe = parcels.map((p) => sanitizeParcelForViewer(p, req.user.role));

  return res.status(200).json({
    status: 'success',
    results: safe.length,
    data: {
      parcels: safe,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

// @desc    Driver: list available parcel orders near driver
// @route   GET /api/v1/parcels/available
// @access  Private/Driver
export const getAvailableParcels = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'driver') throw new AppError('Only drivers can view available parcels', 403);

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const latitude = req.query.latitude !== undefined ? Number(req.query.latitude) : undefined;
  const longitude = req.query.longitude !== undefined ? Number(req.query.longitude) : undefined;
  const radiusKm =
    req.query.radiusKm !== undefined
      ? Number(req.query.radiusKm)
      : Number(driver.searchRadiusKm ?? 5);

  const filter: any = { status: 'pending', driverId: null };
  if (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
  ) {
    filter.pickupLocation = {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: Math.max(0.5, radiusKm) * 1000,
      },
    };
  }

  const parcels = await Parcel.find(filter)
    .populate('userId', 'firstName lastName phone')
    .sort({ createdAt: -1 })
    .limit(50);

  const safe = parcels.map((p) => sanitizeParcelForViewer(p, 'driver'));

  return res.status(200).json({
    status: 'success',
    results: safe.length,
    data: { parcels: safe },
  });
});

// @desc    Get parcel by ID
// @route   GET /api/v1/parcels/:id
// @access  Private
export const getParcelById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const parcel = await Parcel.findById(req.params.id)
    .populate('userId', 'firstName lastName phone')
    .populate({
      path: 'driverId',
      populate: { path: 'userId', select: 'firstName lastName phone' },
    });
  if (!parcel) throw new AppError('Parcel not found', 404);

  if (req.user.role === 'user') {
    if (parcel.userId?.toString() !== req.user._id.toString()) {
      throw new AppError('You are not authorized to view this parcel', 403);
    }
  } else if (req.user.role === 'driver') {
    const driver = await Driver.findOne({ userId: req.user._id });
    if (!driver || parcel.driverId?.toString() !== driver._id.toString()) {
      throw new AppError('You are not authorized to view this parcel', 403);
    }
  } else if (req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  return res.status(200).json({
    status: 'success',
    data: { parcel: sanitizeParcelForViewer(parcel, req.user.role) },
  });
});

// @desc    Driver accepts parcel order
// @route   PUT /api/v1/parcels/:id/accept
// @access  Private/Driver
export const acceptParcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'driver') throw new AppError('Only drivers can accept parcels', 403);

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);
  if (driver.status !== 'approved') throw new AppError('Driver is not approved yet', 403);
  if (!driver.isOnline || !driver.isAvailable) throw new AppError('You are not available to accept parcels', 400);

  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw new AppError('Parcel not found', 404);
  if (parcel.status !== 'pending' || parcel.driverId) throw new AppError('Parcel is not available for acceptance', 400);

  parcel.driverId = driver._id;
  parcel.status = 'assigned';
  await parcel.save();

  driver.isAvailable = false;
  await driver.save();

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to(`user:${parcel.userId.toString()}`).emit('parcel:assigned', sanitizeParcelForViewer(parcel, 'user'));
    // Notify accepting driver too (multi-device/session safety)
    io.to(`user:${driver.userId.toString()}`).emit('parcel:assigned', sanitizeParcelForViewer(parcel, 'driver'));
    // Notify other drivers to remove from "available" lists
    io.to('role:driver:parcel').emit('parcel:unavailable', { id: parcel._id?.toString?.() ?? parcel.id ?? parcel._id });
  }

  return res.status(200).json({
    status: 'success',
    message: 'Parcel accepted successfully',
    data: { parcel: sanitizeParcelForViewer(parcel, 'driver') },
  });
});

// @desc    Driver confirms pickup with pickup OTP
// @route   PUT /api/v1/parcels/:id/pickup
// @access  Private/Driver
export const pickupParcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'driver') throw new AppError('Only drivers can pickup parcels', 403);

  const { otp } = req.body as { otp?: string };
  if (!otp) throw new AppError('OTP is required', 400);

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw new AppError('Parcel not found', 404);
  if (parcel.driverId?.toString() !== driver._id.toString()) {
    throw new AppError('You are not authorized to update this parcel', 403);
  }
  if (!['assigned', 'picked_up'].includes(parcel.status)) {
    throw new AppError('Parcel must be assigned before pickup', 400);
  }
  if (String(parcel.pickupOtp) !== String(otp).trim()) throw new AppError('Invalid pickup OTP', 400);

  parcel.status = 'picked_up';
  parcel.pickupTime = new Date();
  await parcel.save();

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to(`user:${parcel.userId.toString()}`).emit('parcel:status:update', sanitizeParcelForViewer(parcel, 'user'));
    io.to(`user:${driver.userId.toString()}`).emit('parcel:status:update', sanitizeParcelForViewer(parcel, 'driver'));
  }

  return res.status(200).json({
    status: 'success',
    message: 'Parcel pickup confirmed',
    data: { parcel: sanitizeParcelForViewer(parcel, 'driver') },
  });
});

// @desc    Driver marks parcel in transit (no OTP)
// @route   PUT /api/v1/parcels/:id/in-transit
// @access  Private/Driver
export const markParcelInTransit = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'driver') throw new AppError('Only drivers can update parcels', 403);

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw new AppError('Parcel not found', 404);
  if (parcel.driverId?.toString() !== driver._id.toString()) {
    throw new AppError('You are not authorized to update this parcel', 403);
  }
  if (!['picked_up', 'in_transit'].includes(parcel.status)) {
    throw new AppError('Parcel must be picked up before marking in transit', 400);
  }

  parcel.status = 'in_transit';
  await parcel.save();

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to(`user:${parcel.userId.toString()}`).emit('parcel:status:update', sanitizeParcelForViewer(parcel, 'user'));
    io.to(`user:${driver.userId.toString()}`).emit('parcel:status:update', sanitizeParcelForViewer(parcel, 'driver'));
  }

  return res.status(200).json({
    status: 'success',
    message: 'Parcel marked in transit',
    data: { parcel: sanitizeParcelForViewer(parcel, 'driver') },
  });
});

// @desc    Driver confirms delivery with delivery OTP
// @route   PUT /api/v1/parcels/:id/deliver
// @access  Private/Driver
export const deliverParcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'driver') throw new AppError('Only drivers can deliver parcels', 403);

  const { otp, signature } = req.body as { otp?: string; signature?: string };
  if (!otp) throw new AppError('OTP is required', 400);

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw new AppError('Parcel not found', 404);
  if (parcel.driverId?.toString() !== driver._id.toString()) {
    throw new AppError('You are not authorized to update this parcel', 403);
  }
  if (!['picked_up', 'in_transit'].includes(parcel.status)) {
    throw new AppError('Parcel must be picked up before delivery', 400);
  }
  if (String(parcel.deliveryOtp) !== String(otp).trim()) throw new AppError('Invalid delivery OTP', 400);

  parcel.status = 'delivered';
  parcel.deliveryTime = new Date();
  parcel.signature = signature;
  parcel.paymentStatus = parcel.paymentMethod === 'cash' ? 'pending' : 'completed';
  await parcel.save();

  // Release driver
  driver.isAvailable = true;
  await driver.save();

  const io = (req as any).app?.get?.('io');
  if (io) {
    io.to(`user:${parcel.userId.toString()}`).emit('parcel:delivered', sanitizeParcelForViewer(parcel, 'user'));
    io.to(`user:${driver.userId.toString()}`).emit('parcel:delivered', sanitizeParcelForViewer(parcel, 'driver'));
  }

  return res.status(200).json({
    status: 'success',
    message: 'Parcel delivered successfully',
    data: { parcel: sanitizeParcelForViewer(parcel, 'driver') },
  });
});

// @desc    Cancel parcel (user/driver/admin)
// @route   PUT /api/v1/parcels/:id/cancel
// @access  Private
export const cancelParcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body as { reason?: string };

  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw new AppError('Parcel not found', 404);

  const isUser = parcel.userId?.toString() === req.user._id.toString();
  const driver = await Driver.findOne({ userId: req.user._id });
  const isDriver = driver && parcel.driverId?.toString() === driver._id.toString();

  if (!isUser && !isDriver && req.user.role !== 'admin') {
    throw new AppError('You are not authorized to cancel this parcel', 403);
  }
  if (['delivered', 'cancelled'].includes(parcel.status)) {
    throw new AppError('Cannot cancel this parcel', 400);
  }

  parcel.status = 'cancelled';
  parcel.cancelledAt = new Date();
  parcel.cancelledBy = isUser ? 'user' : isDriver ? 'driver' : 'admin';
  parcel.cancellationReason = reason;
  await parcel.save();

  // Release assigned driver (if any)
  if (parcel.driverId) {
    await Driver.findByIdAndUpdate(parcel.driverId, { isAvailable: true });
  }

  const io = (req as any).app?.get?.('io');
  if (io) {
    // Notify user
    io.to(`user:${parcel.userId.toString()}`).emit('parcel:status:update', sanitizeParcelForViewer(parcel, 'user'));
    // Notify driver if assigned
    if (parcel.driverId) {
      const assignedDriver = await Driver.findById(parcel.driverId).select('userId');
      if (assignedDriver?.userId) {
        io.to(`user:${assignedDriver.userId.toString()}`).emit(
          'parcel:status:update',
          sanitizeParcelForViewer(parcel, 'driver')
        );
      }
    } else {
      // If it was still pending, remove from other drivers' available lists
      io.to('role:driver:parcel').emit('parcel:unavailable', { id: parcel._id?.toString?.() ?? parcel.id ?? parcel._id });
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Parcel cancelled successfully',
    data: { parcel: sanitizeParcelForViewer(parcel, req.user.role) },
  });
});

// @desc    Rate parcel delivery (user)
// @route   POST /api/v1/parcels/:id/rate
// @access  Private/User
export const rateParcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'user') throw new AppError('Only users can rate parcel deliveries', 403);
  const { rating, review } = req.body as { rating?: number; review?: string };
  if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

  const parcel = await Parcel.findById(req.params.id);
  if (!parcel) throw new AppError('Parcel not found', 404);
  if (parcel.userId?.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (parcel.status !== 'delivered') throw new AppError('Can only rate delivered parcels', 400);

  parcel.rating = rating;
  parcel.review = review;
  await parcel.save();

  return res.status(200).json({
    status: 'success',
    message: 'Rating submitted successfully',
    data: { parcel: sanitizeParcelForViewer(parcel, 'user') },
  });
});

