import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import User from '../models/User.model';
import Driver from '../models/Driver.model';
import Ride from '../models/Ride.model';
import Payment from '../models/Payment.model';
import PromoUsage from '../models/PromoUsage.model';
import Referral from '../models/Referral.model';

// @desc    Get dashboard overview
// @route   GET /api/v1/analytics/dashboard
// @access  Private/Admin
export const getDashboardOverview = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // User stats
    const totalUsers = await User.countDocuments({ role: 'user', status: 'active' });
    const newUsersToday = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: today },
    });
    const newUsersThisWeek = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: lastWeek },
    });

    // Driver stats
    const totalDrivers = await Driver.countDocuments({ status: 'approved' });
    const onlineDrivers = await Driver.countDocuments({
      isOnline: true,
      status: 'approved',
    });
    const availableDrivers = await Driver.countDocuments({
      isOnline: true,
      isAvailable: true,
      status: 'approved',
    });

    // Ride stats
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const activeRides = await Ride.countDocuments({
      status: { $in: ['requested', 'accepted', 'arrived', 'started'] },
    });
    const ridesToday = await Ride.countDocuments({
      createdAt: { $gte: today },
    });
    const ridesThisWeek = await Ride.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    // Revenue stats
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          avgTransaction: { $avg: '$amount' },
        },
      },
    ]);

    const revenueToday = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const revenueThisWeek = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: lastWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
        },
        drivers: {
          total: totalDrivers,
          online: onlineDrivers,
          available: availableDrivers,
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          active: activeRides,
          today: ridesToday,
          thisWeek: ridesThisWeek,
        },
        revenue: {
          total: revenueData[0]?.totalRevenue || 0,
          average: revenueData[0]?.avgTransaction || 0,
          today: revenueToday[0]?.total || 0,
          thisWeek: revenueThisWeek[0]?.total || 0,
        },
      },
    });
  }
);

// @desc    Get ride analytics
// @route   GET /api/v1/analytics/rides
// @access  Private/Admin
export const getRideAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Rides by status
    const ridesByStatus = await Ride.aggregate([
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { createdAt: dateFilter } }]
        : []),
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Rides by vehicle type
    const ridesByVehicleType = await Ride.aggregate([
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { createdAt: dateFilter } }]
        : []),
      {
        $group: {
          _id: '$vehicleType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$fare.finalFare' },
        },
      },
    ]);

    // Rides by hour of day
    const ridesByHour = await Ride.aggregate([
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { createdAt: dateFilter } }]
        : []),
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Average ride metrics
    const rideMetrics = await Ride.aggregate([
      { $match: { status: 'completed' } },
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { completedAt: dateFilter } }]
        : []),
      {
        $group: {
          _id: null,
          avgDistance: { $avg: '$distance' },
          avgDuration: { $avg: '$duration' },
          avgFare: { $avg: '$fare.finalFare' },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        ridesByStatus,
        ridesByVehicleType,
        ridesByHour,
        metrics: rideMetrics[0] || {},
      },
    });
  }
);

// @desc    Get revenue analytics
// @route   GET /api/v1/analytics/revenue
// @access  Private/Admin
export const getRevenueAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    let groupByFormat: any;
    switch (groupBy) {
      case 'hour':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' },
        };
        break;
      case 'day':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
        break;
      case 'month':
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        };
        break;
      default:
        groupByFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        };
    }

    const revenueOverTime = await Payment.aggregate([
      { $match: { status: 'completed' } },
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { createdAt: dateFilter } }]
        : []),
      {
        $group: {
          _id: groupByFormat,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgTransaction: { $avg: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    // Revenue by payment method
    const revenueByMethod = await Payment.aggregate([
      { $match: { status: 'completed' } },
      ...(Object.keys(dateFilter).length > 0
        ? [{ $match: { createdAt: dateFilter } }]
        : []),
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        revenueOverTime,
        revenueByMethod,
      },
    });
  }
);

// @desc    Get driver performance analytics
// @route   GET /api/v1/analytics/driver-performance
// @access  Private/Admin
export const getDriverPerformance = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const topDriversByRides = await Ride.aggregate([
      { $match: { status: 'completed', driverId: { $ne: null } } },
      {
        $group: {
          _id: '$driverId',
          totalRides: { $sum: 1 },
          totalEarnings: { $sum: '$fare.finalFare' },
          avgRating: { $avg: '$rating.driverRating' },
        },
      },
      { $sort: { totalRides: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driverDetails',
        },
      },
      { $unwind: '$driverDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'driverDetails.userId',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
    ]);

    res.status(200).json({
      status: 'success',
      data: { topDrivers: topDriversByRides },
    });
  }
);

// @desc    Get marketing analytics
// @route   GET /api/v1/analytics/marketing
// @access  Private/Admin
export const getMarketingAnalytics = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    // Promo code usage
    const promoStats = await PromoUsage.aggregate([
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

    // Referral stats
    const referralStats = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          totalRewards: {
            $sum: { $add: ['$referrerReward', '$referredReward'] },
          },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        topPromos: promoStats,
        referrals: referralStats[0] || {},
      },
    });
  }
);

