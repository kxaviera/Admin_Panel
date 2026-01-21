import { Response } from 'express';
import Driver from '../models/Driver.model';
import User from '../models/User.model';
import Zone from '../models/Zone';
import DriverApplication from '../models/DriverApplication';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { SubscriptionService } from '../services/subscription.service';
import { UploadService } from '../services/upload.service';

// @desc    Register as driver
// @route   POST /api/v1/drivers/register
// @access  Private
export const registerDriver = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehicleModel,
      vehicleMake,
      vehicleYear,
      vehicleColor,
      vehicleNumber,
    } = req.body;

    // Check if already registered as driver
    const existingDriver = await Driver.findOne({ userId: req.user._id });

    if (existingDriver) {
      throw new AppError('You are already registered as a driver', 400);
    }

    // Create driver profile
    const driver = await Driver.create({
      userId: req.user._id,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      vehicleModel,
      vehicleMake,
      vehicleYear,
      vehicleColor,
      vehicleNumber,
    });

    // Update user role to driver
    await User.findByIdAndUpdate(req.user._id, { role: 'driver' });

    res.status(201).json({
      status: 'success',
      message: 'Driver registration submitted. Awaiting verification.',
      data: { driver },
    });
  }
);

// @desc    Get all drivers
// @route   GET /api/v1/drivers
// @access  Private/Admin
export const getAllDrivers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.vehicleType) {
      filter.vehicleType = req.query.vehicleType;
    }

    if (req.query.isOnline !== undefined) {
      filter.isOnline = req.query.isOnline === 'true';
    }

    const drivers = await Driver.find(filter)
      .populate('userId', 'firstName lastName email phone profilePicture')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Driver.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: drivers.length,
      data: {
        drivers,
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

// @desc    Get driver by ID
// @route   GET /api/v1/drivers/:id
// @access  Private
export const getDriverById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findById(req.params.id).populate(
      'userId',
      'firstName lastName email phone profilePicture rating'
    );

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { driver },
    });
  }
);

// @desc    Get driver profile (current user)
// @route   GET /api/v1/drivers/me
// @access  Private/Driver
export const getMyDriverProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id }).populate(
      'userId',
      'firstName lastName email phone profilePicture rating'
    );

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { driver },
    });
  }
);

// @desc    Update driver profile
// @route   PUT /api/v1/drivers/:id
// @access  Private/Driver
export const updateDriver = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    // Check if user is updating their own profile or is admin
    if (
      driver.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('You can only update your own profile', 403);
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('userId', 'firstName lastName email phone profilePicture');

    res.status(200).json({
      status: 'success',
      message: 'Driver profile updated successfully',
      data: { driver: updatedDriver },
    });
  }
);

// @desc    Update driver location
// @route   PUT /api/v1/drivers/location
// @access  Private/Driver
export const updateDriverLocation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { longitude, latitude } = req.body;

    if (!longitude || !latitude) {
      throw new AppError('Longitude and latitude are required', 400);
    }

    const driver = await Driver.findOneAndUpdate(
      { userId: req.user._id },
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    ).populate('userId', 'firstName lastName email phone profilePicture rating');

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Location updated successfully',
      data: { driver, location: driver.currentLocation },
    });
  }
);

// @desc    Toggle driver online status
// @route   PUT /api/v1/drivers/toggle-online
// @access  Private/Driver
export const toggleOnlineStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    if (driver.status !== 'approved') {
      throw new AppError('Your driver profile is not approved yet', 403);
    }

    // Enforce subscription when going online.
    // (Going offline is always allowed.)
    if (!driver.isOnline) {
      const ok = await SubscriptionService.hasValidSubscription(driver._id);
      if (!ok) {
        throw new AppError(
          'Subscription expired. Please subscribe to a plan to go online and accept jobs.',
          403
        );
      }
    }

    driver.isOnline = !driver.isOnline;
    await driver.save();

    res.status(200).json({
      status: 'success',
      message: `Driver is now ${driver.isOnline ? 'online' : 'offline'}`,
      data: { isOnline: driver.isOnline },
    });
  }
);

// @desc    Approve/Reject driver
// @route   PUT /api/v1/drivers/:id/verify
// @access  Private/Admin
export const verifyDriver = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        status,
        documentsVerified: status === 'approved',
      },
      { new: true }
    ).populate('userId', 'firstName lastName email phone');

    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    // When a driver is approved, ensure the free "Starter Welcome" trial exists
    if (status === 'approved') {
      await SubscriptionService.ensureDefaultPlans();
      await SubscriptionService.ensureWelcomeTrial(driver._id);
    }

    res.status(200).json({
      status: 'success',
      message: `Driver ${status} successfully`,
      data: { driver },
    });
  }
);

// @desc    Get nearby drivers
// @route   GET /api/v1/drivers/nearby
// @access  Private
export const getNearbyDrivers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { longitude, latitude, maxDistance = 5000, vehicleType } = req.query;

    if (!longitude || !latitude) {
      throw new AppError('Longitude and latitude are required', 400);
    }

    const query: any = {
      isOnline: true,
      isAvailable: true,
      status: 'approved',
      currentRide: null,
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude as string), parseFloat(latitude as string)],
          },
          $maxDistance: parseInt(maxDistance as string), // in meters
        },
      },
    };

    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    const drivers = await Driver.find(query)
      .limit(10)
      .populate('userId', 'firstName lastName profilePicture rating');

    res.status(200).json({
      status: 'success',
      results: drivers.length,
      data: { drivers },
    });
  }
);

// @desc    Apply to become a driver (public lead -> DriverApplication)
// @route   POST /api/v1/drivers/apply
// @access  Public
export const applyToBeDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    vehicleType,
    vehicleNumber,
    vehicleModel,
    vehicleColor,
    serviceCategory,
    aadharNumber,
    dlNumber,
    address,
  } = req.body as any;

  const fullName = (name || '').toString().trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const resolvedFirst = (firstName || parts[0] || '').toString().trim() || 'Driver';
  const resolvedLast = (lastName || parts.slice(1).join(' ') || '').toString().trim() || 'Applicant';

  // Handle file uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // Email and phone are optional for RC upload, but required for profile info submission
  // If only files are uploaded (RC documents), email/phone can be empty
  // They will be provided when profile info is submitted
  const hasFiles = files && (
    (files.rcFront && files.rcFront[0]) ||
    (files.rcBack && files.rcBack[0]) ||
    (files.aadharFront && files.aadharFront[0]) ||
    (files.aadharBack && files.aadharBack[0]) ||
    (files.dlFront && files.dlFront[0]) ||
    (files.dlBack && files.dlBack[0]) ||
    (files.profilePicture && files.profilePicture[0])
  );

  // If email/phone are provided, validate them
  // If only files are uploaded without email/phone, allow it (RC upload only)
  if (email || phone) {
    if (!email || !phone) {
      throw new AppError('Both email and phone are required when provided', 400);
    }
  } else if (!hasFiles) {
    // If no files and no email/phone, require at least email/phone
    throw new AppError('email and phone are required', 400);
  }

  const normalizedCategory = ['ride', 'parcel', 'both'].includes(String(serviceCategory || '').toLowerCase())
    ? String(serviceCategory).toLowerCase()
    : 'ride';
  
  const applicationData: any = {
    firstName: resolvedFirst,
    lastName: resolvedLast,
    ...(email && { email: String(email).trim().toLowerCase() }),
    ...(phone && { phone: String(phone).trim() }),
    serviceCategory: normalizedCategory,
    status: 'pending',
    vehicleDetails: vehicleType || vehicleNumber || vehicleModel || vehicleColor
      ? {
          vehicleType,
          make: '',
          model: vehicleModel || '',
          year: new Date().getFullYear(),
          vehicleNumber: vehicleNumber || '',
          color: vehicleColor || '',
        }
      : undefined,
    notes: [
      licenseNumber ? `licenseNumber:${licenseNumber}` : null,
      aadharNumber && aadharNumber.trim() ? `aadharNumber:${aadharNumber.trim()}` : null,
      dlNumber && dlNumber.trim() ? `dlNumber:${dlNumber.trim()}` : null,
      address && address.trim() ? `address:${address.trim()}` : null,
    ].filter(Boolean).join('; ') || undefined,
    documents: {
      license: {
        verified: false,
      },
      aadhar: {
        verified: false,
      },
      photo: {
        verified: false,
      },
      backgroundCheck: {
        verified: false,
      },
    },
  };

  // Process uploaded files
  if (files) {
    // Profile picture
    if (files.profilePicture && files.profilePicture[0]) {
      const filename = files.profilePicture[0].filename;
      applicationData.documents.photo.url = UploadService.getFileUrl(
        `documents/${filename}`
      );
    }

    // Driving License (DL) - front and back
    const dlDocs: string[] = [];
    if (files.dlFront && files.dlFront[0]) {
      const filename = files.dlFront[0].filename;
      const dlFrontUrl = UploadService.getFileUrl(`documents/${filename}`);
      applicationData.documents.license.url = dlFrontUrl;
      dlDocs.push(`dlFront:${dlFrontUrl}`);
    }
    if (files.dlBack && files.dlBack[0]) {
      const filename = files.dlBack[0].filename;
      dlDocs.push(`dlBack:${UploadService.getFileUrl(`documents/${filename}`)}`);
    }

    // Aadhar - front and back
    const aadharDocs: string[] = [];
    if (files.aadharFront && files.aadharFront[0]) {
      const filename = files.aadharFront[0].filename;
      const aadharFrontUrl = UploadService.getFileUrl(`documents/${filename}`);
      applicationData.documents.aadhar.url = aadharFrontUrl;
      aadharDocs.push(`aadharFront:${aadharFrontUrl}`);
    }
    if (files.aadharBack && files.aadharBack[0]) {
      const filename = files.aadharBack[0].filename;
      aadharDocs.push(`aadharBack:${UploadService.getFileUrl(`documents/${filename}`)}`);
    }

    // RC documents - store in notes (DriverApplication model doesn't have RC field)
    const rcDocs: string[] = [];
    if (files.rcFront && files.rcFront[0]) {
      const filename = files.rcFront[0].filename;
      rcDocs.push(`rcFront:${UploadService.getFileUrl(`documents/${filename}`)}`);
    }
    if (files.rcBack && files.rcBack[0]) {
      const filename = files.rcBack[0].filename;
      rcDocs.push(`rcBack:${UploadService.getFileUrl(`documents/${filename}`)}`);
    }

    // Store all document URLs in notes
    const allDocUrls = [...dlDocs, ...aadharDocs, ...rcDocs];
    if (allDocUrls.length > 0) {
      applicationData.notes = [
        applicationData.notes,
        ...allDocUrls,
      ].filter(Boolean).join('; ');
    }
  }

  const application = await DriverApplication.create(applicationData);

  res.status(201).json({
    status: 'success',
    message: 'Driver application submitted successfully',
    data: { application },
  });
});

// @desc    Get driver statistics
// @route   GET /api/v1/drivers/stats
// @access  Private (admin = global, driver = self)
export const getDriverStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver) throw new AppError('Driver profile not found', 404);

      return res.status(200).json({
        status: 'success',
        data: {
          scope: 'self',
          driverId: driver._id,
          status: driver.status,
          isOnline: driver.isOnline,
          isAvailable: driver.isAvailable,
          totalRides: driver.totalRides,
          totalEarnings: driver.totalEarnings,
          currentRide: driver.currentRide,
        },
      });
    }

    if (req.user.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    const totalDrivers = await Driver.countDocuments();
    const approvedDrivers = await Driver.countDocuments({ status: 'approved' });
    const onlineDrivers = await Driver.countDocuments({
      isOnline: true,
      status: 'approved',
    });
    const availableDrivers = await Driver.countDocuments({
      isOnline: true,
      isAvailable: true,
      status: 'approved',
    });

    const vehicleTypeStats = await Driver.aggregate([
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
        totalDrivers,
        approvedDrivers,
        onlineDrivers,
        availableDrivers,
        vehicleTypeStats,
      },
    });
  }
);

// @desc    Get drivers for admin live map (locations + derived status)
// @route   GET /api/v1/drivers/map
// @access  Private/Admin
export const getDriversMap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const zoneCode = (req.query.zoneCode as string | undefined)?.trim();
  const onlyApproved = req.query.onlyApproved !== 'false';

  const baseFilter: any = {};
  if (onlyApproved) baseFilter.status = 'approved';

  if (zoneCode) {
    const zone = await Zone.findOne({ code: zoneCode.toUpperCase() });
    if (!zone) {
      throw new AppError('Zone not found', 404);
    }
    baseFilter.currentLocation = {
      $geoWithin: {
        $geometry: zone.geometry,
      },
    };
  }

  const drivers = await Driver.find(baseFilter)
    .populate('userId', 'firstName lastName phone')
    .select('currentLocation isOnline isAvailable currentRide vehicleType status updatedAt');

  const mapped = drivers.map((d: any) => {
    const coords = d.currentLocation?.coordinates || [];
    const lng = coords[0];
    const lat = coords[1];

    let state: 'offline' | 'available' | 'busy' | 'on_trip' = 'offline';
    if (d.isOnline) {
      if (d.currentRide) state = 'on_trip';
      else if (d.isAvailable) state = 'available';
      else state = 'busy';
    }

    return {
      id: d._id,
      user: d.userId,
      lat,
      lng,
      isOnline: d.isOnline,
      isAvailable: d.isAvailable,
      currentRide: d.currentRide,
      vehicleType: d.vehicleType,
      status: d.status,
      state,
      updatedAt: d.updatedAt,
    };
  });

  const counts = mapped.reduce(
    (acc: any, d: any) => {
      acc.total += 1;
      acc[d.state] = (acc[d.state] || 0) + 1;
      return acc;
    },
    { total: 0, offline: 0, available: 0, busy: 0, on_trip: 0 }
  );

  res.status(200).json({
    status: 'success',
    data: {
      counts,
      drivers: mapped,
    },
  });
});

// @desc    Get heatmap points (driver density)
// @route   GET /api/v1/drivers/heatmap
// @access  Private/Admin
export const getDriverHeatmap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const zoneCode = (req.query.zoneCode as string | undefined)?.trim();
  const mode = (req.query.mode as string | undefined)?.trim() || 'online'; // online|all

  const filter: any = {};
  if (mode === 'online') filter.isOnline = true;
  filter.status = 'approved';

  if (zoneCode) {
    const zone = await Zone.findOne({ code: zoneCode.toUpperCase() });
    if (!zone) {
      throw new AppError('Zone not found', 404);
    }
    filter.currentLocation = {
      $geoWithin: {
        $geometry: zone.geometry,
      },
    };
  }

  const drivers = await Driver.find(filter).select('currentLocation');
  const points = drivers
    .map((d: any) => {
      const coords = d.currentLocation?.coordinates || [];
      const lng = coords[0];
      const lat = coords[1];
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      if (lat === 0 && lng === 0) return null;
      return [lat, lng, 1];
    })
    .filter(Boolean);

  res.status(200).json({
    status: 'success',
    data: { points },
  });
});

