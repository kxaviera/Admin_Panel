import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import Referral from '../models/Referral.model';
import User from '../models/User.model';
import { NotificationService } from '../services/notification.service';

/**
 * Generate unique referral code
 */
const generateReferralCode = (name: string): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const namePrefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
  return `${namePrefix}${random}`;
};

// @desc    Get my referral code
// @route   GET /api/v1/referral/my-code
// @access  Private
export const getMyReferralCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    let referral = await Referral.findOne({
      referrerUserId: req.user._id,
      referredUserId: null,
    });

    if (!referral) {
      // Create new referral code
      const code = generateReferralCode(req.user.firstName);
      
      referral = await Referral.create({
        referrerUserId: req.user._id,
        referralCode: code,
        status: 'pending',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { referralCode: referral.referralCode },
    });
  }
);

// @desc    Apply referral code during registration
// @route   POST /api/v1/referral/apply
// @access  Public
export const applyReferralCode = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { referralCode, code, newUserId } = req.body as {
      referralCode?: string;
      code?: string;
      newUserId?: string;
    };

    const effectiveCode = (referralCode || code || '').toString().trim();
    const effectiveNewUserId = (newUserId || (req.user?._id?.toString() as any) || '').toString().trim();

    if (!effectiveCode) throw new AppError('Referral code is required', 400);
    if (!effectiveNewUserId) throw new AppError('newUserId is required', 400);

    const referral = await Referral.findOne({
      referralCode: effectiveCode.toUpperCase(),
      status: 'pending',
      referredUserId: null,
      expiresAt: { $gt: new Date() },
    });

    if (!referral) {
      throw new AppError('Invalid or expired referral code', 404);
    }

    // Check if user is not referring themselves
    if (referral.referrerUserId.toString() === effectiveNewUserId) {
      throw new AppError('Cannot use your own referral code', 400);
    }

    // Update referral
    referral.referredUserId = effectiveNewUserId as any;
    referral.referredAt = new Date();
    referral.status = 'completed';
    referral.completedAt = new Date();
    await referral.save();

    // TODO: Credit rewards to both users' wallets
    // This would be implemented when wallet system is added

    // Send notifications
    const referrer = await User.findById(referral.referrerUserId);
    const referred = await User.findById(effectiveNewUserId);

    if (referrer && referred) {
      if (referrer.phone && referrer.email) {
        await NotificationService.sendReferralNotification(
          referrer.phone,
          referrer.email,
          referral.referralCode
        );
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Referral code applied successfully',
      data: {
        referrerReward: referral.referrerReward,
        referredReward: referral.referredReward,
      },
    });
  }
);

// @desc    Get my referral history (legacy alias)
// @route   GET /api/v1/referral/history
// @access  Private
export const getMyReferralHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const referrals = await Referral.find({
    referrerUserId: req.user._id,
    referredUserId: { $ne: null },
  })
    .populate('referredUserId', 'firstName lastName email phone')
    .sort({ referredAt: -1 })
    .limit(50);

  // IMPORTANT: return a plain array (some clients expect List)
  res.status(200).json(referrals);
});

// @desc    Get my referral statistics
// @route   GET /api/v1/referral/my-stats
// @access  Private
export const getMyReferralStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const totalReferrals = await Referral.countDocuments({
      referrerUserId: req.user._id,
      referredUserId: { $ne: null },
    });

    const completedReferrals = await Referral.countDocuments({
      referrerUserId: req.user._id,
      status: 'completed',
    });

    const pendingReferrals = await Referral.countDocuments({
      referrerUserId: req.user._id,
      status: 'pending',
      referredUserId: { $ne: null },
    });

    const totalRewards = await Referral.aggregate([
      {
        $match: {
          referrerUserId: req.user._id,
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$referrerReward' },
        },
      },
    ]);

    const recentReferrals = await Referral.find({
      referrerUserId: req.user._id,
      referredUserId: { $ne: null },
    })
      .populate('referredUserId', 'firstName lastName email')
      .sort({ referredAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalRewards: totalRewards[0]?.total || 0,
        recentReferrals,
      },
    });
  }
);

// @desc    Get all referrals (Admin)
// @route   GET /api/v1/referral
// @access  Private/Admin
export const getAllReferrals = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const referrals = await Referral.find(filter)
      .populate('referrerUserId', 'firstName lastName email phone')
      .populate('referredUserId', 'firstName lastName email phone')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Referral.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: referrals.length,
      data: {
        referrals,
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

// @desc    Get referral statistics (Admin)
// @route   GET /api/v1/referral/stats
// @access  Private/Admin
export const getReferralStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Non-admins get their own stats (mobile clients call /referral/stats)
    if (req.user.role !== 'admin') {
      const totalReferrals = await Referral.countDocuments({
        referrerUserId: req.user._id,
        referredUserId: { $ne: null },
      });

      const completedReferrals = await Referral.countDocuments({
        referrerUserId: req.user._id,
        status: 'completed',
      });

      const pendingReferrals = await Referral.countDocuments({
        referrerUserId: req.user._id,
        status: 'pending',
        referredUserId: { $ne: null },
      });

      const totalRewards = await Referral.aggregate([
        {
          $match: {
            referrerUserId: req.user._id,
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$referrerReward' },
          },
        },
      ]);

      return res.status(200).json({
        status: 'success',
        data: {
          scope: 'self',
          totalReferrals,
          completedReferrals,
          pendingReferrals,
          totalRewards: totalRewards[0]?.total || 0,
        },
      });
    }

    const totalReferrals = await Referral.countDocuments({
      referredUserId: { $ne: null },
    });

    const completedReferrals = await Referral.countDocuments({
      status: 'completed',
    });

    const pendingReferrals = await Referral.countDocuments({
      status: 'pending',
      referredUserId: { $ne: null },
    });

    const totalRewards = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          referrerRewards: { $sum: '$referrerReward' },
          referredRewards: { $sum: '$referredReward' },
        },
      },
    ]);

    const topReferrers = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$referrerUserId',
          referralCount: { $sum: 1 },
          totalRewards: { $sum: '$referrerReward' },
        },
      },
      { $sort: { referralCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        scope: 'global',
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        conversionRate: totalReferrals
          ? ((completedReferrals / totalReferrals) * 100).toFixed(2)
          : 0,
        totalRewardsGiven:
          (totalRewards[0]?.referrerRewards || 0) +
          (totalRewards[0]?.referredRewards || 0),
        topReferrers,
      },
    });
  }
);

// @desc    Update referral rewards (Admin)
// @route   PUT /api/v1/referral/rewards
// @access  Private/Admin
export const updateReferralRewards = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { referrerReward, referredReward } = req.body;

    // Update future referrals (not yet applied)
    await Referral.updateMany(
      {
        status: 'pending',
        referredUserId: null,
      },
      {
        referrerReward,
        referredReward,
        rewardAmount: referrerReward + referredReward,
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Referral rewards updated successfully',
    });
  }
);

