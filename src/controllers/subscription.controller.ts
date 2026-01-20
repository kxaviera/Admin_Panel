import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import SubscriptionPlan from '../models/SubscriptionPlan.model';
import DriverSubscription from '../models/DriverSubscription.model';
import Driver from '../models/Driver.model';
import { SubscriptionService } from '../services/subscription.service';
import Service from '../models/Service';

const paiseToRupees = (amountPaise: number | undefined | null): number => {
  const n = Number(amountPaise || 0);
  return Math.round(n) / 100;
};

const formatInr = (amountPaise: number | undefined | null): string => {
  const rupees = paiseToRupees(amountPaise);
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rupees)}`;
};

// @desc    Get all subscription plans
// @route   GET /api/v1/subscriptions/plans
// @access  Public
export const getAllPlans = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    // Ensure default plans exist (safe/idempotent)
    await SubscriptionService.ensureDefaultPlans();

    const plans = await SubscriptionPlan.find({ isActive: true }).sort({
      sortOrder: 1,
      price: 1,
    });

    // IMPORTANT: return a plain array (some mobile clients expect List)
    res.status(200).json(plans);
  }
);

// @desc    Get all subscription plans (including inactive)
// @route   GET /api/v1/subscriptions/plans/admin
// @access  Private/Admin
export const getAllPlansAdmin = asyncHandler(async (_req: AuthRequest, res: Response) => {
  // Ensure default plans exist (safe/idempotent)
  await SubscriptionService.ensureDefaultPlans();

  const plans = await SubscriptionPlan.find({})
    .populate('serviceId', 'name code category vehicleType')
    .sort({
    isActive: -1,
    sortOrder: 1,
    price: 1,
  });

  // Keep plain array for dashboard simplicity
  res.status(200).json(plans);
});

// @desc    Create subscription plan
// @route   POST /api/v1/subscriptions/plans
// @access  Private/Admin
export const createPlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // If a plan is tied to a specific vehicle(Service), normalize fields.
    let normalized: any = { ...req.body };
    if (req.body?.serviceId) {
      const service = await Service.findById(String(req.body.serviceId)).select('category vehicleType');
      if (!service) throw new AppError('Invalid serviceId', 400);
      normalized = {
        ...normalized,
        serviceId: service._id,
        appliesToCategory: service.category === 'parcel' ? 'parcel' : 'ride',
        appliesToVehicleType: String(service.vehicleType || 'all').toLowerCase(),
      };
    }

    const planData = {
      ...normalized,
      createdBy: req.user._id,
    };

    const plan = await SubscriptionPlan.create(planData);

    res.status(201).json({
      status: 'success',
      message: 'Subscription plan created successfully',
      data: { plan },
    });
  }
);

// @desc    Update subscription plan
// @route   PUT /api/v1/subscriptions/plans/:id
// @access  Private/Admin
export const updatePlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // If changing serviceId, normalize fields.
    let normalized: any = { ...req.body };
    if (req.body?.serviceId) {
      const service = await Service.findById(String(req.body.serviceId)).select('category vehicleType');
      if (!service) throw new AppError('Invalid serviceId', 400);
      normalized = {
        ...normalized,
        serviceId: service._id,
        appliesToCategory: service.category === 'parcel' ? 'parcel' : 'ride',
        appliesToVehicleType: String(service.vehicleType || 'all').toLowerCase(),
      };
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      normalized,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Plan updated successfully',
      data: { plan },
    });
  }
);

// @desc    Delete subscription plan
// @route   DELETE /api/v1/subscriptions/plans/:id
// @access  Private/Admin
export const deletePlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Plan deactivated successfully',
    });
  }
);

// @desc    Subscribe to a plan
// @route   POST /api/v1/subscriptions/subscribe
// @access  Private/Driver
export const subscribeToPlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { planId, planCode, paymentMethod } = req.body;

    // Get driver profile
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    let resolvedPlanId = planId;
    if (!resolvedPlanId && planCode) {
      const plan = await SubscriptionPlan.findOne({ code: String(planCode).toUpperCase() });
      if (!plan) throw new AppError('Plan not found', 404);
      resolvedPlanId = plan._id;
    }

    // Validate plan applicability vs driver vehicle
    if (resolvedPlanId) {
      const plan: any = await SubscriptionPlan.findById(resolvedPlanId).select(
        'appliesToVehicleType appliesToCategory serviceId isActive'
      );
      if (plan && plan.isActive) {
        const planVehicle = String(plan.appliesToVehicleType || 'all').toLowerCase();
        const driverVehicle = String(driver.vehicleType || '').toLowerCase();
        if (planVehicle !== 'all' && driverVehicle && planVehicle !== driverVehicle) {
          throw new AppError('This plan is not applicable for your vehicle type', 400);
        }
      }
    }
    if (!resolvedPlanId) {
      throw new AppError('planId or planCode is required', 400);
    }

    // Subscribe driver
    const subscription = await SubscriptionService.subscribeDriver(
      driver._id,
      resolvedPlanId,
      paymentMethod,
      req.user._id
    );

    res.status(201).json({
      status: 'success',
      message: 'Subscribed successfully',
      data: { subscription },
    });
  }
);

// @desc    Get my subscription
// @route   GET /api/v1/subscriptions/my-subscription
// @access  Private/Driver
export const getMySubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    const subscription = await SubscriptionService.getActiveSubscription(
      driver._id
    );

    if (!subscription) {
      return res.status(200).json({
        status: 'success',
        data: { subscription: null, hasSubscription: false },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        subscription,
        hasSubscription: true,
        isValid: subscription.status === 'active' && subscription.endDate > new Date(),
      },
    });
  }
);

// @desc    Get subscription screen data (Driver App UI)
// @route   GET /api/v1/subscriptions/ui
// @access  Private/Driver
export const getSubscriptionUi = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Ensure plans exist
  await SubscriptionService.ensureDefaultPlans();

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const active = await SubscriptionService.getActiveSubscription(driver._id);

  const plansAll = await SubscriptionPlan.find({ isActive: true })
    .populate('serviceId', 'name code category vehicleType')
    .sort({ sortOrder: 1, price: 1 });

  // Show only relevant plans for this driver (matching vehicle type), but keep full list too.
  const driverVehicle = String(driver.vehicleType || '').toLowerCase();
  const plans =
    driverVehicle.length > 0
      ? plansAll.filter((p: any) => {
          const vt = String(p.appliesToVehicleType || 'all').toLowerCase();
          return vt === 'all' || vt === driverVehicle;
        })
      : plansAll;

  const now = new Date();
  const activePlan: any = active ? (active.planId as any) : null;
  const remainingDays =
    active && active.endDate
      ? Math.max(0, Math.ceil((new Date(active.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;

  res.status(200).json({
    status: 'success',
    data: {
      hasActivePlan: Boolean(active),
      activePlan: active
        ? {
            subscriptionId: active._id,
            planId: activePlan?._id,
            planCode: activePlan?.code,
            name: activePlan?.name,
            durationDays: activePlan?.durationDays,
            durationLabel: activePlan?.durationDays ? `${activePlan.durationDays} Days` : activePlan?.duration,
            startDate: active.startDate,
            endDate: active.endDate,
            remainingDays,
            totalEarningsPaise: active.totalEarnings || 0,
            totalEarnings: paiseToRupees(active.totalEarnings || 0),
            ridesCompleted: active.ridesCompleted || 0,
            isTrial: Boolean(activePlan?.isTrial),
            discountLabel: activePlan?.discountLabel,
          }
        : null,
      plans: plans.map((p: any) => ({
        id: p._id,
        code: p.code,
        title: p.name,
        description: p.description,
        appliesToCategory: p.appliesToCategory || 'all',
        appliesToVehicleType: p.appliesToVehicleType || 'all',
        service: p.serviceId
          ? {
              id: p.serviceId._id,
              name: p.serviceId.name,
              code: p.serviceId.code,
              category: p.serviceId.category,
              vehicleType: p.serviceId.vehicleType,
            }
          : null,
        duration: p.duration,
        durationDays: p.durationDays,
        durationLabel: p.durationDays ? `${p.durationDays} Days` : p.duration,
        pricePaise: p.price,
        price: paiseToRupees(p.price),
        priceDisplay: formatInr(p.price),
        originalPricePaise: p.originalPrice || 0,
        originalPrice: paiseToRupees(p.originalPrice || 0),
        originalPriceDisplay: p.originalPrice ? formatInr(p.originalPrice) : null,
        discount: p.discount || 0,
        discountLabel: p.discountLabel || null,
        features: p.features || [],
        isRecommended: Boolean(p.isRecommended),
        isBestValue: Boolean(p.isBestValue),
        isTrial: Boolean(p.isTrial),
        sortOrder: p.sortOrder || 0,
      })),
      allPlans: plansAll.map((p: any) => ({
        id: p._id,
        code: p.code,
        title: p.name,
        appliesToCategory: p.appliesToCategory || 'all',
        appliesToVehicleType: p.appliesToVehicleType || 'all',
      })),
      driver: {
        driverId: driver._id,
        registrationDate: driver.createdAt,
        totalEarningsPaise: driver.totalEarnings || 0,
        totalEarnings: paiseToRupees(driver.totalEarnings || 0),
      },
    },
  });
});

// @desc    Get subscription history
// @route   GET /api/v1/subscriptions/history
// @access  Private/Driver
export const getSubscriptionHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    const subscriptions = await DriverSubscription.find({
      driverId: driver._id,
    })
      .populate('planId')
      .populate('paymentRefId')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: { subscriptions },
    });
  }
);

// @desc    Cancel subscription
// @route   PUT /api/v1/subscriptions/:id/cancel
// @access  Private/Driver
export const cancelSubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const subscription = await DriverSubscription.findById(req.params.id);

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    // Verify ownership
    const driver = await Driver.findOne({
      _id: subscription.driverId,
      userId: req.user._id,
    });

    if (!driver && req.user.role !== 'admin') {
      throw new AppError('Not authorized', 403);
    }

    const cancelledSubscription = await SubscriptionService.cancelSubscription(
      subscription._id
    );

    res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled successfully',
      data: { subscription: cancelledSubscription },
    });
  }
);

// @desc    Renew subscription
// @route   POST /api/v1/subscriptions/renew
// @access  Private/Driver
export const renewSubscription = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    const subscription = await SubscriptionService.renewSubscription(
      driver._id,
      req.user._id
    );

    res.status(201).json({
      status: 'success',
      message: 'Subscription renewed successfully',
      data: { subscription },
    });
  }
);

// @desc    Toggle auto-renew
// @route   PUT /api/v1/subscriptions/:id/auto-renew
// @access  Private/Driver
export const toggleAutoRenew = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const subscription = await DriverSubscription.findById(req.params.id);

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    // Verify ownership
    const driver = await Driver.findOne({
      _id: subscription.driverId,
      userId: req.user._id,
    });

    if (!driver) {
      throw new AppError('Not authorized', 403);
    }

    subscription.autoRenew = !subscription.autoRenew;
    await subscription.save();

    res.status(200).json({
      status: 'success',
      message: `Auto-renew ${subscription.autoRenew ? 'enabled' : 'disabled'}`,
      data: { autoRenew: subscription.autoRenew },
    });
  }
);

// @desc    Get all subscriptions (Admin)
// @route   GET /api/v1/subscriptions
// @access  Private/Admin
export const getAllSubscriptions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const subscriptions = await DriverSubscription.find(filter)
      .populate('driverId')
      .populate('planId')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await DriverSubscription.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: {
        subscriptions,
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

// @desc    Get subscription statistics (Admin)
// @route   GET /api/v1/subscriptions/stats
// @access  Private/Admin
export const getSubscriptionStats = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const stats = await SubscriptionService.getSubscriptionStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  }
);

// @desc    Check subscription validity
// @route   GET /api/v1/subscriptions/check-validity
// @access  Private/Driver
export const checkSubscriptionValidity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    const hasValidSubscription = await SubscriptionService.hasValidSubscription(
      driver._id
    );

    const subscription = await SubscriptionService.getActiveSubscription(
      driver._id
    );

    res.status(200).json({
      status: 'success',
      data: {
        hasValidSubscription,
        subscription,
        canAcceptRides: hasValidSubscription,
      },
    });
  }
);

// @desc    Get active subscription (legacy alias)
// @route   GET /api/v1/subscriptions/active
// @access  Private/Driver
export const getActiveSubscription = getMySubscription;

// @desc    Cancel active subscription (legacy alias)
// @route   POST /api/v1/subscriptions/cancel
// @access  Private/Driver
export const cancelMyActiveSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const active = await SubscriptionService.getActiveSubscription(driver._id);
  if (!active) {
    return res.status(200).json({
      status: 'success',
      message: 'No active subscription',
      data: { subscription: null },
    });
  }

  const cancelled = await SubscriptionService.cancelSubscription(active._id);
  return res.status(200).json({
    status: 'success',
    message: 'Subscription cancelled successfully',
    data: { subscription: cancelled },
  });
});

// @desc    Subscription stats (admin = global, driver = self snapshot)
// @route   GET /api/v1/subscriptions/stats
// @access  Private
export const getSubscriptionStatsForCaller = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user.role === 'admin') {
    const stats = await SubscriptionService.getSubscriptionStats();
    return res.status(200).json({ status: 'success', data: stats });
  }

  if (req.user.role !== 'driver') throw new AppError('Not authorized', 403);

  // Reuse the UI payload as a safe "stats" snapshot for drivers.
  // (Many clients just need active plan + remainingDays + totals.)
  await SubscriptionService.ensureDefaultPlans();

  const driver = await Driver.findOne({ userId: req.user._id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const active = await SubscriptionService.getActiveSubscription(driver._id);
  const now = new Date();
  const remainingDays =
    active && active.endDate
      ? Math.max(0, Math.ceil((new Date(active.endDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;

  return res.status(200).json({
    status: 'success',
    data: {
      scope: 'self',
      hasActivePlan: Boolean(active),
      remainingDays,
      totalEarningsPaise: active?.totalEarnings || 0,
      ridesCompleted: active?.ridesCompleted || 0,
      subscription: active || null,
    },
  });
});

