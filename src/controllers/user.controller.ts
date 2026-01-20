import { Response } from 'express';
import User from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthRequest } from '../middleware/auth.middleware';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
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

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private
export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Only admin or self can read full user profile
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      throw new AppError('You are not authorized to view this user', 403);
    }

    const user = await User.findById(req.params.id).select(
      '-password -refreshToken'
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  }
);

// @desc    Update user profile
// @route   PUT /api/v1/users/:id
// @access  Private
export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, dateOfBirth, gender, address } = req.body;

    // Check if user is updating their own profile or is admin
    if (
      req.params.id !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('You can only update your own profile', 403);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        address,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password -refreshToken');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user },
    });
  }
);

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  }
);

// @desc    Get user stats
// @route   GET /api/v1/users/stats
// @access  Private/Admin
export const getUserStats = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);

    const totalUsers = await User.countDocuments({ status: 'active' });
    const totalDrivers = await User.countDocuments({
      role: 'driver',
      status: 'active',
    });
    const totalRiders = await User.countDocuments({
      role: 'user',
      status: 'active',
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalDrivers,
        totalRiders,
        stats,
      },
    });
  }
);

// @desc    Update my profile (mobile clients)
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, phone, address } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };

  const update: any = {};
  if (typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    update.firstName = parts[0] || undefined;
    update.lastName = parts.slice(1).join(' ') || undefined;
  }
  if (typeof email === 'string' && email.trim()) update.email = email.trim().toLowerCase();
  if (typeof phone === 'string' && phone.trim()) update.phone = phone.trim();
  if (typeof address === 'string' && address.trim()) update.address = { street: address.trim() };

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken');

  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { user },
  });
});

// @desc    Update my location (mobile clients)
// @route   PUT /api/v1/users/location
// @access  Private
export const updateMyLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.body as { latitude?: number; longitude?: number };
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new AppError('latitude and longitude are required', 400);
  }

  await User.findByIdAndUpdate(req.user._id, {
    currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
  });

  res.status(200).json({
    status: 'success',
    message: 'Location updated successfully',
    data: { location: { latitude, longitude } },
  });
});

