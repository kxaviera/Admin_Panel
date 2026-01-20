import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import PromoCode from '../models/PromoCode.model';
import PromoUsage from '../models/PromoUsage.model';
import Ride from '../models/Ride.model';

const toPaise = (amount: any): number => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // If it's already large (>= 10000) assume paise; else assume rupees.
  return Number.isInteger(n) && n >= 10000 ? n : Math.round(n * 100);
};

const computeDiscount = (promo: any, rideAmountPaise: number, vehicleType?: string) => {
  // Check minimum ride amount
  if (rideAmountPaise < (promo.minRideAmount || 0)) {
    throw new AppError(`Minimum ride amount of ₹${(promo.minRideAmount || 0) / 100} required`, 400);
  }

  // Check vehicle type if provided
  if (
    vehicleType &&
    promo.applicableVehicleTypes &&
    promo.applicableVehicleTypes.length > 0 &&
    !promo.applicableVehicleTypes.includes(vehicleType)
  ) {
    throw new AppError('Promo code not applicable for this vehicle type', 400);
  }

  let discountAmount = 0;
  if (promo.discountType === 'percentage') {
    discountAmount = (rideAmountPaise * promo.discountValue) / 100;
  } else {
    discountAmount = promo.discountValue;
  }

  // Apply max discount limit
  if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
    discountAmount = promo.maxDiscountAmount;
  }

  discountAmount = Math.min(discountAmount, rideAmountPaise);
  return {
    discountAmount: Math.round(discountAmount),
    finalAmount: Math.round(rideAmountPaise - discountAmount),
  };
};

// @desc    Create promo code
// @route   POST /api/v1/promo
// @access  Private/Admin
export const createPromoCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const promoData = {
      ...req.body,
      createdBy: req.user._id,
    };

    const promo = await PromoCode.create(promoData);

    res.status(201).json({
      status: 'success',
      message: 'Promo code created successfully',
      data: { promo },
    });
  }
);

// @desc    Get all promo codes
// @route   GET /api/v1/promo
// @access  Private/Admin
export const getAllPromoCodes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const promos = await PromoCode.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await PromoCode.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: promos.length,
      data: {
        promos,
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

// @desc    Validate and apply promo code
// @route   POST /api/v1/promo/validate
// @access  Private
export const validatePromoCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { code, rideAmount, amount, vehicleType } = req.body as any;

    // Find promo code
    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!promo) {
      throw new AppError('Invalid promo code', 404);
    }

    // Check validity period
    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new AppError('Promo code has expired', 400);
    }

    // Check usage limit
    if (promo.usageCount >= promo.usageLimit) {
      throw new AppError('Promo code usage limit reached', 400);
    }

    // Check per user limit
    const userUsageCount = await PromoUsage.countDocuments({
      promoCodeId: promo._id,
      userId: req.user._id,
    });

    if (userUsageCount >= promo.perUserLimit) {
      throw new AppError('You have reached the usage limit for this promo code', 400);
    }

    // Some clients call validate with only the code. If no amount provided, just return promo info.
    const amountPaise = toPaise(rideAmount ?? amount);
    if (!amountPaise) {
      return res.status(200).json({
        status: 'success',
        message: 'Promo code is valid',
        data: {
          promoCode: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          minRideAmount: promo.minRideAmount,
          maxDiscountAmount: promo.maxDiscountAmount,
        },
      });
    }

    const { discountAmount, finalAmount } = computeDiscount(promo, amountPaise, vehicleType);

    return res.status(200).json({
      status: 'success',
      message: 'Promo code is valid',
      data: {
        promoCode: promo.code,
        discountAmount,
        finalAmount,
      },
    });
  }
);

// @desc    Apply promo code to ride
// @route   POST /api/v1/promo/apply
// @access  Private
export const applyPromoCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { code, rideId, discountAmount, amount, rideAmount, vehicleType } = req.body as any;

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!promo) {
      throw new AppError('Invalid promo code', 404);
    }

    const resolvedRideId = rideId
      ? rideId
      : undefined;

    // If client doesn't pass discountAmount, compute from amount (rupees) or rideAmount (paise)
    const amountPaise = toPaise(rideAmount ?? amount);
    const computed = amountPaise ? computeDiscount(promo, amountPaise, vehicleType) : null;
    const resolvedDiscountAmount =
      typeof discountAmount === 'number'
        ? discountAmount
        : computed?.discountAmount;

    // If rideId is provided, ensure it belongs to the user (best-effort)
    if (resolvedRideId) {
      const ride = await Ride.findById(resolvedRideId);
      if (ride && ride.userId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new AppError('Not authorized for this ride', 403);
      }
    }

    // Record usage
    await PromoUsage.create({
      promoCodeId: promo._id,
      userId: req.user._id,
      rideId: resolvedRideId,
      discountAmount: resolvedDiscountAmount || 0,
    });

    // Increment usage count
    promo.usageCount += 1;
    await promo.save();

    return res.status(200).json({
      status: 'success',
      message: 'Promo code applied successfully',
      data: {
        discountAmount: resolvedDiscountAmount || 0,
        ...(computed ? { finalAmount: computed.finalAmount } : {}),
      },
    });
  }
);

// @desc    Get available promo codes (mobile clients)
// @route   GET /api/v1/promo/available
// @access  Private
export const getAvailablePromoCodes = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const now = new Date();
  const promos = await PromoCode.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })
    .sort({ createdAt: -1 })
    .select('code description discountType discountValue minRideAmount maxDiscountAmount validFrom validUntil');

  // IMPORTANT: return a plain array (some clients expect List)
  res.status(200).json(promos);
});

// @desc    Update promo code
// @route   PUT /api/v1/promo/:id
// @access  Private/Admin
export const updatePromoCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!promo) {
      throw new AppError('Promo code not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Promo code updated successfully',
      data: { promo },
    });
  }
);

// @desc    Delete promo code
// @route   DELETE /api/v1/promo/:id
// @access  Private/Admin
export const deletePromoCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const promo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!promo) {
      throw new AppError('Promo code not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Promo code deactivated successfully',
    });
  }
);

// @desc    Get promo code statistics
// @route   GET /api/v1/promo/stats
// @access  Private/Admin
export const getPromoStats = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const totalPromos = await PromoCode.countDocuments();
    const activePromos = await PromoCode.countDocuments({ isActive: true });

    const usageStats = await PromoUsage.aggregate([
      {
        $group: {
          _id: null,
          totalUsage: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
        },
      },
    ]);

    const topPromos = await PromoUsage.aggregate([
      {
        $group: {
          _id: '$promoCodeId',
          usageCount: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'promocodes',
          localField: '_id',
          foreignField: '_id',
          as: 'promoDetails',
        },
      },
      { $unwind: '$promoDetails' },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalPromos,
        activePromos,
        totalUsage: usageStats[0]?.totalUsage || 0,
        totalDiscount: usageStats[0]?.totalDiscount || 0,
        topPromos,
      },
    });
  }
);

// @desc    Get user's promo history
// @route   GET /api/v1/promo/my-usage
// @access  Private
export const getMyPromoUsage = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const usage = await PromoUsage.find({ userId: req.user._id })
      .populate('promoCodeId', 'code description discountType discountValue')
      .populate('rideId', 'pickupLocation dropoffLocation fare')
      .sort({ usedAt: -1 })
      .limit(20);

    const totalSavings = await PromoUsage.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: '$discountAmount' } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        usage,
        totalSavings: totalSavings[0]?.total || 0,
      },
    });
  }
);

