import { Response } from 'express';
import Ride from '../models/Ride.model';
import Driver from '../models/Driver.model';
import User from '../models/User.model';
import Chat from '../models/Chat';
import Service from '../models/Service';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateFare } from '../utils/fareCalculator';
import { getDistance } from 'geolib';
import { SMSService } from '../services/sms.service';
import { SubscriptionService } from '../services/subscription.service';

function sanitizeRideForViewer(ride: any, viewerRole: string) {
  const obj = typeof ride?.toObject === 'function' ? ride.toObject() : ride;
  if (viewerRole !== 'user') {
    delete obj.otp;
  }
  return obj;
}

// @desc    Request a ride
// @route   POST /api/v1/rides
// @access  Private/User
export const requestRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user.role !== 'user') {
      throw new AppError('Only users can request rides', 403);
    }

    const {
      pickupLocation,
      dropoffLocation,
      vehicleType,
      paymentMethod,
      scheduledTime,
    } = req.body;

    // Calculate distance
    const distance = getDistance(
      {
        latitude: pickupLocation.coordinates[1],
        longitude: pickupLocation.coordinates[0],
      },
      {
        latitude: dropoffLocation.coordinates[1],
        longitude: dropoffLocation.coordinates[0],
      }
    ) / 1000; // Convert to km

    // Calculate estimated fare
    const estimatedFare = calculateFare(distance, 0, vehicleType);

    // Create ride
    const ride = await Ride.create({
      userId: req.user._id,
      pickupLocation,
      dropoffLocation,
      vehicleType,
      paymentMethod,
      scheduledTime,
      distance,
      estimatedFare: estimatedFare.finalFare,
    });

    // Realtime notify online drivers (OTP is never sent to drivers)
    const io = (req as any).app?.get?.('io');
    if (io) {
      const payload = sanitizeRideForViewer(ride, 'driver');
      // Notify only drivers within their configured radius, and eligible for this vehicleType.
      // This prevents far-away drivers from getting spammed.
      const vt = String(ride.vehicleType || '').toLowerCase().trim();
      const eligibleVts = await Service.find({ category: 'ride', isActive: true })
        .distinct('vehicleType');
      if (eligibleVts.map((x) => String(x).toLowerCase().trim()).includes(vt)) {
        const pickupLng = Number(pickupLocation?.coordinates?.[0]);
        const pickupLat = Number(pickupLocation?.coordinates?.[1]);
        if (Number.isFinite(pickupLng) && Number.isFinite(pickupLat)) {
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
                  vehicleType: vt,
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
            io.to(`user:${uid}`).emit('ride:new', payload);
          }
        } else {
          // Fallback: broadcast to ride-capable drivers if pickup coords missing
          io.to('role:driver:ride').emit('ride:new', payload);
        }
      } else {
        // If service not configured, fallback to existing behavior.
        io.to('role:driver:ride').emit('ride:new', payload);
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Ride requested successfully',
      data: { ride },
    });
  }
);

// @desc    Get available ride requests near driver
// @route   GET /api/v1/rides/available
// @access  Private/Driver
export const getAvailableRides = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'driver') {
    throw new AppError('Only drivers can view available rides', 403);
  }

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  // Optional geo filter: latitude/longitude/radiusKm
  const latitude = req.query.latitude !== undefined ? Number(req.query.latitude) : undefined;
  const longitude = req.query.longitude !== undefined ? Number(req.query.longitude) : undefined;
  const radiusKm =
    req.query.radiusKm !== undefined
      ? Number(req.query.radiusKm)
      : Number(driver.searchRadiusKm ?? 5);

  const filter: any = {
    status: 'requested',
    driverId: null,
  };

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

  const rides = await Ride.find(filter)
    .populate('userId', 'firstName lastName phone profilePicture')
    .sort({ requestedAt: -1 })
    .limit(50);

  const safe = rides.map((r) => sanitizeRideForViewer(r, 'driver'));

  return res.status(200).json({
    status: 'success',
    results: safe.length,
    data: { rides: safe },
  });
});

// @desc    Get all rides
// @route   GET /api/v1/rides
// @access  Private
export const getAllRides = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If user role, show only their rides
    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    }

    // If driver role, show only their rides
    if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (driver) {
        filter.driverId = driver._id;
      }
    }

    // Admin-only filters (support operations dashboards)
    if (req.user.role === 'admin') {
      if (req.query.userId) {
        filter.userId = String(req.query.userId);
      }
      if (req.query.driverId) {
        filter.driverId = String(req.query.driverId);
      }
    }

    // Common filters (allowed for any role; role-based scoping above still applies)
    if (req.query.vehicleType) {
      filter.vehicleType = String(req.query.vehicleType);
    }
    if (req.query.paymentMethod) {
      filter.paymentMethod = String(req.query.paymentMethod);
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = String(req.query.paymentStatus);
    }
    if (req.query.cancelledBy) {
      filter.cancelledBy = String(req.query.cancelledBy);
    }

    // Date range filter: ?from=2026-01-01&to=2026-01-31 (ISO date or timestamp)
    const fromRaw = req.query.from ? String(req.query.from) : undefined;
    const toRaw = req.query.to ? String(req.query.to) : undefined;
    const from = fromRaw ? new Date(fromRaw) : undefined;
    const to = toRaw ? new Date(toRaw) : undefined;
    if (
      (from && !Number.isNaN(from.getTime())) ||
      (to && !Number.isNaN(to.getTime()))
    ) {
      filter.createdAt = {
        ...(from && !Number.isNaN(from.getTime()) ? { $gte: from } : {}),
        ...(to && !Number.isNaN(to.getTime()) ? { $lte: to } : {}),
      };
    }

    if (req.query.status) {
      const raw = String(req.query.status);
      const parts = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      filter.status = parts.length > 1 ? { $in: parts } : raw;
    }

    const rides = await Ride.find(filter)
      .populate('userId', 'firstName lastName phone profilePicture')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'firstName lastName phone profilePicture',
        },
      })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Ride.countDocuments(filter);
    const safe = rides.map((r) => sanitizeRideForViewer(r, req.user.role));

    res.status(200).json({
      status: 'success',
      results: safe.length,
      data: {
        rides: safe,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

// @desc    Get ride by ID
// @route   GET /api/v1/rides/:id
// @access  Private
export const getRideById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const ride = await Ride.findById(req.params.id)
      .populate('userId', 'firstName lastName phone profilePicture rating')
      .populate({
        path: 'driverId',
        populate: {
          path: 'userId',
          select: 'firstName lastName phone profilePicture rating',
        },
      });

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    // Authorization: user can only see own ride; driver can only see assigned ride; admin sees all
    if (req.user.role === 'user') {
      if (ride.userId?.toString() !== req.user._id.toString()) {
        throw new AppError('You are not authorized to view this ride', 403);
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver || ride.driverId?.toString() !== driver._id.toString()) {
        throw new AppError('You are not authorized to view this ride', 403);
      }
    } else if (req.user.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    res.status(200).json({
      status: 'success',
      data: { ride: sanitizeRideForViewer(ride, req.user.role) },
    });
  }
);

// @desc    Accept ride
// @route   PUT /api/v1/rides/:id/accept
// @access  Private/Driver
export const acceptRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    if (driver.status !== 'approved') {
      throw new AppError('Driver is not approved yet', 403);
    }

    if (!driver.isOnline || !driver.isAvailable) {
      throw new AppError('You are not available to accept rides', 400);
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    if (ride.status !== 'requested' || ride.driverId) {
      throw new AppError('Ride is not available for acceptance', 400);
    }

    // Update ride
    ride.driverId = driver._id;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    // Update driver
    driver.isAvailable = false;
    driver.currentRide = ride._id;
    await driver.save();

    // Ensure chat exists for this ride (user <-> driver)
    const chat = await Chat.findOneAndUpdate(
      { ride: ride._id },
      {
        $setOnInsert: {
          participants: { user: ride.userId, driver: driver._id },
          ride: ride._id,
          messages: [],
          unreadCount: { user: 0, driver: 0 },
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('_id');

    // Notify user (SMS + realtime). OTP is shared with user only.
    const user = await User.findById(ride.userId).select('phone');
    if (user?.phone) {
      const driverUser = await User.findById(driver.userId).select('firstName lastName');
      const driverName = driverUser
        ? `${driverUser.firstName || ''} ${driverUser.lastName || ''}`.trim() || 'Driver'
        : 'Driver';
      await SMSService.sendRideConfirmation(user.phone, {
        driverName,
        vehicleNumber: driver.vehicleNumber,
        otp: ride.otp || '',
      });
    }

    const io = (req as any).app?.get?.('io');
    if (io) {
      io.to(`user:${ride.userId.toString()}`).emit('ride:accepted', {
        ...sanitizeRideForViewer(ride, 'user'),
        chatId: chat?._id?.toString?.(),
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Ride accepted successfully',
      data: {
        ride: sanitizeRideForViewer(ride, req.user.role),
        chatId: chat?._id?.toString?.(),
      },
    });
  }
);

// @desc    Update ride status
// @route   PUT /api/v1/rides/:id/status
// @access  Private/Driver
export const updateRideStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const status = (req.body as any)?.status as string | undefined;
    const otp = (req.body as any)?.otp as string | undefined;
    const validStatuses = ['arrived', 'started', 'completed'];

    if (typeof status !== 'string' || !validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver || ride.driverId?.toString() !== driver._id.toString()) {
      throw new AppError('You are not authorized to update this ride', 403);
    }

    // Enforce correct progression
    if (status === 'arrived' && !['accepted', 'arrived'].includes(ride.status)) {
      throw new AppError('Ride must be accepted before marking arrived', 400);
    }
    if (status === 'started' && ride.status !== 'arrived') {
      throw new AppError('Ride must be arrived before starting', 400);
    }
    if (status === 'completed' && ride.status !== 'started') {
      throw new AppError('Ride must be started before completing', 400);
    }

    // Update ride status
    ride.status = status as any;

    if (status === 'arrived') {
      ride.arrivedAt = new Date();
      const user = await User.findById(ride.userId).select('phone');
      const driverUser = await User.findById(driver.userId).select('firstName lastName');
      const driverName = driverUser
        ? `${driverUser.firstName || ''} ${driverUser.lastName || ''}`.trim() || 'Driver'
        : 'Driver';
      if (user?.phone) {
        await SMSService.sendDriverArrival(user.phone, driverName);
      }
    } else if (status === 'started') {
      // OTP required to start ride (user shares OTP with driver)
      if (!otp || String(otp).trim().length === 0) {
        throw new AppError('OTP is required to start the ride', 400);
      }
      if (!ride.otp || String(ride.otp) !== String(otp).trim()) {
        throw new AppError('Invalid OTP', 400);
      }
      ride.startedAt = new Date();
    } else if (status === 'completed') {
      ride.completedAt = new Date();
      
      // Calculate final fare
      const fare = calculateFare(
        ride.distance || 0,
        ride.duration || 0,
        ride.vehicleType
      );
      ride.fare = fare;
      ride.paymentStatus = ride.paymentMethod === 'cash' ? 'pending' : 'completed';

      // Update driver availability and earnings (100% to driver - no commission!)
      driver.isAvailable = true;
      driver.currentRide = undefined;
      driver.totalRides += 1;
      driver.totalEarnings += fare.finalFare; // Driver gets 100% of fare
      await driver.save();

      // Update subscription earnings tracking
      await SubscriptionService.updateSubscriptionEarnings(
        driver._id,
        fare.finalFare
      );

      // If subscription is expired, stop services AFTER finishing this ride:
      // force driver offline so they won't keep receiving/accepting new jobs.
      const stillValid = await SubscriptionService.hasValidSubscription(driver._id);
      if (!stillValid) {
        driver.isOnline = false;
        await driver.save();
      }

      // Update user stats
      await User.findByIdAndUpdate(ride.userId, {
        $inc: { totalRides: 1 },
      });

      // Notify user ride completion
      const user = await User.findById(ride.userId).select('phone');
      if (user?.phone) {
        await SMSService.sendRideCompletion(user.phone, fare.finalFare);
      }
    }

    await ride.save();

    const io = (req as any).app?.get?.('io');
    if (io) {
      // Notify user (and driver) in real-time for in-app notifications.
      const payload = sanitizeRideForViewer(ride, 'user');
      io.to(`user:${ride.userId.toString()}`).emit('ride:status:update', payload);
      if (ride.driverId) {
        const driverRoomUserId = driver.userId?.toString?.();
        if (driverRoomUserId) {
          io.to(`user:${driverRoomUserId}`).emit('ride:status:update', sanitizeRideForViewer(ride, 'driver'));
        }
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Ride ${status} successfully`,
      data: {
        ride: sanitizeRideForViewer(ride, req.user.role),
        // Hint to clients (driver app) that subscription may now be required.
        // (We still allow ride completion to succeed.)
        subscriptionRequired: status === 'completed'
          ? !(await SubscriptionService.hasValidSubscription(driver._id))
          : false,
      },
    });
  }
);

// @desc    Cancel ride
// @route   PUT /api/v1/rides/:id/cancel
// @access  Private
export const cancelRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    // Check if user is authorized to cancel
    const isUser = ride.userId.toString() === req.user._id.toString();
    const driver = await Driver.findOne({ userId: req.user._id });
    const isDriver = driver && ride.driverId?.toString() === driver._id.toString();

    if (!isUser && !isDriver && req.user.role !== 'admin') {
      throw new AppError('You are not authorized to cancel this ride', 403);
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
      throw new AppError('Cannot cancel this ride', 400);
    }

    // Update ride
    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancelledBy = isUser ? 'user' : isDriver ? 'driver' : 'admin';
    ride.cancellationReason = reason;
    await ride.save();

    // If driver was assigned, make them available again
    if (ride.driverId && driver) {
      driver.isAvailable = true;
      driver.currentRide = undefined;
      await driver.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Ride cancelled successfully',
      data: { ride },
    });
  }
);

// @desc    Rate ride
// @route   PUT /api/v1/rides/:id/rate
// @access  Private
export const rateRide = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    if (ride.status !== 'completed') {
      throw new AppError('Can only rate completed rides', 400);
    }

    const isUser = ride.userId.toString() === req.user._id.toString();
    const driver = await Driver.findOne({ userId: req.user._id });
    const isDriver = driver && ride.driverId?.toString() === driver._id.toString();

    if (!isUser && !isDriver) {
      throw new AppError('You are not authorized to rate this ride', 403);
    }

    // Update rating
    if (isUser) {
      ride.rating = ride.rating || {};
      ride.rating.driverRating = rating;
      ride.rating.driverReview = review;

      // Update driver rating
      if (ride.driverId) {
        const driverProfile = await Driver.findById(ride.driverId);
        if (driverProfile) {
          const totalRides = driverProfile.totalRides;
          driverProfile.rating =
            (driverProfile.rating * (totalRides - 1) + rating) / totalRides;
          await driverProfile.save();
        }
      }
    } else if (isDriver) {
      ride.rating = ride.rating || {};
      ride.rating.userRating = rating;
      ride.rating.userReview = review;

      // Update user rating
      const user = await User.findById(ride.userId);
      if (user) {
        const totalRides = user.totalRides;
        user.rating = ((user.rating || 0) * (totalRides - 1) + rating) / totalRides;
        await user.save();
      }
    }

    await ride.save();

    res.status(200).json({
      status: 'success',
      message: 'Rating submitted successfully',
      data: { ride },
    });
  }
);

// @desc    Get ride statistics
// @route   GET /api/v1/rides/stats
// @access  Private/Admin
export const getRideStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Admins: global stats
    if (req.user.role === 'admin') {
      const totalRides = await Ride.countDocuments();
      const completedRides = await Ride.countDocuments({ status: 'completed' });
      const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });
      const activeRides = await Ride.countDocuments({
        status: { $in: ['requested', 'accepted', 'arrived', 'started'] },
      });

      const revenueStats = await Ride.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$fare.finalFare' },
            avgFare: { $avg: '$fare.finalFare' },
          },
        },
      ]);

      const vehicleTypeStats = await Ride.aggregate([
        {
          $group: {
            _id: '$vehicleType',
            count: { $sum: 1 },
          },
        },
      ]);

      return res.status(200).json({
        status: 'success',
        data: {
          scope: 'global',
          totalRides,
          completedRides,
          cancelledRides,
          activeRides,
          revenue: revenueStats[0] || { totalRevenue: 0, avgFare: 0 },
          vehicleTypeStats,
        },
      });
    }

    // Users/Drivers: personal stats
    const filter: any = {};
    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (driver) filter.driverId = driver._id;
      else filter.driverId = null; // no rides
    } else {
      throw new AppError('Not authorized', 403);
    }

    const totalRides = await Ride.countDocuments(filter);
    const completedRides = await Ride.countDocuments({ ...filter, status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ ...filter, status: 'cancelled' });
    const activeRides = await Ride.countDocuments({
      ...filter,
      status: { $in: ['requested', 'accepted', 'arrived', 'started'] },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        scope: req.user.role,
        totalRides,
        completedRides,
        cancelledRides,
        activeRides,
      },
    });
  }
);

