import mongoose from 'mongoose';
import SubscriptionPlan from '../models/SubscriptionPlan.model';
import DriverSubscription from '../models/DriverSubscription.model';
import Driver from '../models/Driver.model';
import Service from '../models/Service';
import { WalletService } from './wallet.service';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export class SubscriptionService {
  private static resolveDailyPricePaise(service: any): number {
    const vehicleType = String(service?.vehicleType || '').toLowerCase().trim();
    const category = String(service?.category || '').toLowerCase().trim();

    // Defaults requested by you (can be edited from Admin UI):
    // Ride example: bike ₹50/day, auto ₹60/day, etc.
    const rideDaily: Record<string, number> = {
      bike: 50_00,
      auto: 60_00,
      sedan: 70_00,
      suv: 80_00,
      luxury: 100_00,
    };

    const parcelDaily: Record<string, number> = {
      bike: 40_00,
      auto: 50_00,
      van: 80_00,
      tempo: 90_00,
      truck: 120_00,
    };

    const table = category === 'parcel' ? parcelDaily : rideDaily;
    return table[vehicleType] ?? (category === 'parcel' ? 50_00 : 60_00);
  }

  private static buildVehiclePlansForService(service: any) {
    const category = String(service.category).toLowerCase();
    const vehicleType = String(service.vehicleType || '').toLowerCase();
    const daily = this.resolveDailyPricePaise(service);

    // Simple pricing formula:
    // - weekly: 6x daily (1 day free)
    // - monthly: 25x daily (5 days free)
    const weekly = daily * 6;
    const monthly = daily * 25;

    const featureLine = category === 'parcel' ? '0% commission on deliveries' : '0% commission on rides';

    const base = {
      serviceId: service._id,
      appliesToCategory: category === 'parcel' ? 'parcel' : 'ride',
      appliesToVehicleType: vehicleType || 'all',
      currency: 'INR',
      isActive: true,
      isPopular: false,
      isRecommended: false,
      isBestValue: false,
      isTrial: false,
      features: [featureLine, 'Unlimited jobs', 'Priority support'],
    };

    const safeCode = String(service.code || service._id).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const safeName = String(service.name || vehicleType || 'Vehicle').trim();

    return [
      {
        ...base,
        code: `PLAN_${safeCode}_DAILY`,
        name: `${safeName} • Daily`,
        description: `${safeName} day pass`,
        duration: 'daily',
        durationDays: 1,
        price: daily,
        originalPrice: daily,
        discount: 0,
        discountLabel: null,
        sortOrder: 10,
      },
      {
        ...base,
        code: `PLAN_${safeCode}_WEEKLY`,
        name: `${safeName} • Weekly`,
        description: `${safeName} 7 days`,
        duration: 'weekly',
        durationDays: 7,
        price: weekly,
        originalPrice: daily * 7,
        discount: 14,
        discountLabel: '1 day FREE',
        sortOrder: 11,
        isRecommended: true,
      },
      {
        ...base,
        code: `PLAN_${safeCode}_MONTHLY`,
        name: `${safeName} • Monthly`,
        description: `${safeName} 30 days`,
        duration: 'monthly',
        durationDays: 30,
        price: monthly,
        originalPrice: daily * 30,
        discount: 17,
        discountLabel: '5 days FREE',
        sortOrder: 12,
        isBestValue: true,
      },
    ];
  }

  /**
   * Ensure default subscription plans exist (idempotent).
   * Prices are stored in paise (per env.ts convention).
   */
  static async ensureDefaultPlans(): Promise<void> {
    const plans = [
      {
        code: 'STARTER_WELCOME',
        name: 'Starter Welcome',
        description: 'New Driver Special (30 days free, 0% commission)',
        duration: 'monthly',
        durationDays: 30,
        price: 0,
        originalPrice: 0,
        discount: 100,
        discountLabel: 'FREE',
        currency: 'INR',
        features: [
          '0% commission on rides',
          'Valid for 30 days',
          'Unlimited rides',
          'Perfect to get started',
        ],
        isActive: true,
        isPopular: true,
        isRecommended: false,
        isBestValue: false,
        isTrial: true,
        sortOrder: 0,
      },
      {
        code: 'QUICK_START',
        name: 'Quick Start',
        description: 'Day Pass (0% commission, unlimited rides)',
        duration: 'daily',
        durationDays: 1,
        price: 9900, // ₹99
        originalPrice: 19900, // ₹199
        discount: 50,
        discountLabel: '50% OFF',
        currency: 'INR',
        features: [
          '0% commission on rides',
          'Valid for 1 day',
          'Unlimited rides',
          '24/7 priority support',
        ],
        isActive: true,
        isPopular: false,
        isRecommended: false,
        isBestValue: false,
        isTrial: false,
        sortOrder: 1,
      },
      {
        code: 'POWER_DRIVE',
        name: 'Power Drive',
        description: '7 Days (Recommended)',
        duration: 'weekly',
        durationDays: 7,
        price: 49900, // ₹499
        originalPrice: 99900, // ₹999
        discount: 50,
        discountLabel: '50% OFF',
        currency: 'INR',
        features: [
          '0% commission on rides',
          'Valid for 7 days',
          'Unlimited rides',
          '24/7 priority support',
        ],
        isActive: true,
        isPopular: true,
        isRecommended: true,
        isBestValue: false,
        isTrial: false,
        sortOrder: 2,
      },
      {
        code: 'ELITE_PARTNER',
        name: 'Elite Partner',
        description: '30 Days (Best Value)',
        duration: 'monthly',
        durationDays: 30,
        price: 149900, // ₹1,499
        originalPrice: 399900, // ₹3,999
        discount: 62,
        discountLabel: '62% OFF',
        currency: 'INR',
        features: [
          '0% commission on rides',
          'Valid for 30 days',
          'Unlimited rides',
          '24/7 priority support',
        ],
        isActive: true,
        isPopular: true,
        isRecommended: false,
        isBestValue: true,
        isTrial: false,
        sortOrder: 3,
      },
    ];

    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate(
        { code: plan.code },
        { $setOnInsert: plan },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    // Vehicle-specific plans (ride + parcel)
    const services = await Service.find({
      isActive: true,
      category: { $in: ['ride', 'parcel'] },
    })
      .select('_id name code category vehicleType')
      .sort({ order: 1 });

    for (const s of services) {
      const vehiclePlans = this.buildVehiclePlansForService(s);
      for (const vp of vehiclePlans) {
        await SubscriptionPlan.findOneAndUpdate(
          { code: vp.code },
          { $setOnInsert: vp },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
  }

  /**
   * Calculate subscription end date based on duration
   */
  static calculateEndDate(startDate: Date, duration: string): Date {
    const endDate = new Date(startDate);

    switch (duration) {
      case 'daily':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        throw new AppError('Invalid duration', 400);
    }

    return endDate;
  }

  /**
   * Calculate subscription end date based on plan (supports fixed durationDays).
   */
  static calculateEndDateForPlan(startDate: Date, plan: any): Date {
    if (plan?.durationDays && Number.isFinite(plan.durationDays)) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Number(plan.durationDays));
      return endDate;
    }
    return this.calculateEndDate(startDate, plan?.duration);
  }

  /**
   * Grant the "Starter Welcome" free trial subscription (idempotent).
   * Uses driver.createdAt as the trial start, so remaining days match UI.
   */
  static async ensureWelcomeTrial(driverId: mongoose.Types.ObjectId): Promise<void> {
    const driver = await Driver.findById(driverId);
    if (!driver) return;

    // Only grant if driver has never had any subscription before.
    const anyExisting = await DriverSubscription.exists({ driverId });
    if (anyExisting) return;

    const welcomePlan = await SubscriptionPlan.findOne({
      code: 'STARTER_WELCOME',
      isActive: true,
    });
    if (!welcomePlan) return;

    const startDate = driver.createdAt || new Date();
    const endDate = this.calculateEndDateForPlan(startDate, welcomePlan);
    const now = new Date();

    // If the welcome trial is already over, don't create it.
    if (endDate <= now) return;

    await DriverSubscription.create({
      driverId,
      planId: welcomePlan._id,
      status: 'active',
      startDate,
      endDate,
      paymentMethod: 'free',
      autoRenew: false,
      ridesCompleted: 0,
      totalEarnings: 0,
    });
  }

  /**
   * Subscribe driver to a plan
   */
  static async subscribeDriver(
    driverId: mongoose.Types.ObjectId,
    planId: mongoose.Types.ObjectId,
    paymentMethod: string,
    userId: mongoose.Types.ObjectId
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get driver
      const driver = await Driver.findById(driverId);
      if (!driver) {
        throw new AppError('Driver not found', 404);
      }

      if (driver.status !== 'approved') {
        throw new AppError('Driver must be approved to subscribe', 400);
      }

      // Get plan
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan || !plan.isActive) {
        throw new AppError('Invalid or inactive subscription plan', 404);
      }

      if ((plan as any).code === 'STARTER_WELCOME') {
        throw new AppError('Starter Welcome is granted automatically to new drivers', 400);
      }

      // Check for active subscription
      const activeSubscription = await DriverSubscription.findOne({
        driverId,
        status: 'active',
        endDate: { $gt: new Date() },
      });

      if (activeSubscription) {
        throw new AppError('Driver already has an active subscription', 400);
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = this.calculateEndDateForPlan(startDate, plan);

      // Process payment based on method
      let paymentRefId;
      let paymentRefModel: 'Payment' | 'WalletTransaction' | undefined;
      if (paymentMethod === 'wallet') {
        // Deduct from wallet
        const transaction = await WalletService.debit(
          userId,
          plan.price,
          'subscription',
          `Subscription: ${plan.name}`,
          planId,
          'SubscriptionPlan'
        );
        paymentRefId = transaction._id;
        paymentRefModel = 'WalletTransaction';
      }
      // For other payment methods, payment would be processed via Stripe/payment gateway

      // Create subscription
      const subscription = await DriverSubscription.create(
        [
          {
            driverId,
            planId,
            status: paymentMethod === 'wallet' ? 'active' : 'pending',
            startDate,
            endDate,
            paymentMethod,
            paymentRefId,
            paymentRefModel,
            autoRenew: false,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      logger.info(`Driver ${driverId} subscribed to plan ${planId}`);

      return subscription[0];
    } catch (error: any) {
      await session.abortTransaction();
      logger.error(`Subscription error: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get active subscription for driver
   */
  static async getActiveSubscription(
    driverId: mongoose.Types.ObjectId
  ): Promise<any> {
    // Auto-grant Starter Welcome for eligible drivers (idempotent)
    await this.ensureWelcomeTrial(driverId);

    const subscription = await DriverSubscription.findOne({
      driverId,
      status: 'active',
      endDate: { $gt: new Date() },
    }).populate('planId');

    return subscription;
  }

  /**
   * Check if driver has valid subscription
   */
  static async hasValidSubscription(
    driverId: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const subscription = await this.getActiveSubscription(driverId);
    return !!subscription;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    subscriptionId: mongoose.Types.ObjectId
  ): Promise<any> {
    const subscription = await DriverSubscription.findById(subscriptionId);

    if (!subscription) {
      throw new AppError('Subscription not found', 404);
    }

    if (subscription.status !== 'active') {
      throw new AppError('Subscription is not active', 400);
    }

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    logger.info(`Subscription ${subscriptionId} cancelled`);
    return subscription;
  }

  /**
   * Renew subscription
   */
  static async renewSubscription(
    driverId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<any> {
    const currentSubscription = await DriverSubscription.findOne({
      driverId,
      status: { $in: ['active', 'expired'] },
    })
      .sort({ endDate: -1 })
      .populate('planId');

    if (!currentSubscription) {
      throw new AppError('No subscription found to renew', 404);
    }

    const plan = currentSubscription.planId as any;

    // Create new subscription
    return await this.subscribeDriver(
      driverId,
      plan._id,
      currentSubscription.paymentMethod,
      userId
    );
  }

  /**
   * Update subscription earnings
   */
  static async updateSubscriptionEarnings(
    driverId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<void> {
    const subscription = await this.getActiveSubscription(driverId);

    if (subscription) {
      subscription.ridesCompleted += 1;
      subscription.totalEarnings += amount;
      await subscription.save();
    }
  }

  /**
   * Get subscription statistics
   */
  static async getSubscriptionStats(): Promise<any> {
    const totalSubscriptions = await DriverSubscription.countDocuments();
    const activeSubscriptions = await DriverSubscription.countDocuments({
      status: 'active',
      endDate: { $gt: new Date() },
    });

    const revenueStats = await DriverSubscription.aggregate([
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$plan.price' },
          avgPrice: { $avg: '$plan.price' },
        },
      },
    ]);

    const planDistribution = await DriverSubscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: '_id',
          foreignField: '_id',
          as: 'plan',
        },
      },
      { $unwind: '$plan' },
      {
        $project: {
          planName: '$plan.name',
          duration: '$plan.duration',
          count: 1,
        },
      },
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      revenue: revenueStats[0] || { totalRevenue: 0, avgPrice: 0 },
      planDistribution,
    };
  }

  /**
   * Check and expire subscriptions (run as cron job)
   */
  static async expireSubscriptions(): Promise<void> {
    const expiredSubscriptions = await DriverSubscription.updateMany(
      {
        status: 'active',
        endDate: { $lt: new Date() },
      },
      {
        status: 'expired',
      }
    );

    logger.info(
      `Expired ${expiredSubscriptions.modifiedCount} subscriptions`
    );
  }

  /**
   * Auto-renew subscriptions (run as cron job)
   */
  static async autoRenewSubscriptions(): Promise<void> {
    const subscriptionsToRenew = await DriverSubscription.find({
      status: 'active',
      autoRenew: true,
      endDate: {
        $lt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expiring in 24 hours
        $gt: new Date(),
      },
    }).populate('driverId planId');

    for (const subscription of subscriptionsToRenew) {
      try {
        const driver = subscription.driverId as any;
        await this.renewSubscription(driver._id, driver.userId);
        logger.info(`Auto-renewed subscription for driver ${driver._id}`);
      } catch (error: any) {
        logger.error(`Auto-renew failed: ${error.message}`);
      }
    }
  }
}

