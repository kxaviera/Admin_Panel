import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import Payment from '../models/Payment.model';
import Ride from '../models/Ride.model';
import { StripeService } from '../services/stripe.service';

// @desc    Create payment intent for a ride
// @route   POST /api/v1/payments/create-intent
// @access  Private
export const createPaymentIntent = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { rideId } = req.body;

    // Get ride details
    const ride = await Ride.findById(rideId);

    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    // Verify user is the ride owner
    if (ride.userId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to pay for this ride', 403);
    }

    if (ride.status !== 'completed') {
      throw new AppError('Can only pay for completed rides', 400);
    }

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      ride.fare.finalFare,
      'inr',
      {
        rideId: ride._id.toString(),
        userId: req.user._id.toString(),
        driverId: ride.driverId?.toString(),
      }
    );

    // Create payment record
    const payment = await Payment.create({
      rideId: ride._id,
      userId: req.user._id,
      driverId: ride.driverId,
      amount: ride.fare.finalFare,
      currency: 'INR',
      paymentMethod: 'card',
      status: 'processing',
      stripePaymentIntentId: paymentIntent.id,
    });

    res.status(200).json({
      status: 'success',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id,
        amount: ride.fare.finalFare,
      },
    });
  }
);

// @desc    Confirm payment
// @route   POST /api/v1/payments/confirm
// @access  Private
export const confirmPayment = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { paymentIntentId, paymentMethodId } = req.body as {
      paymentIntentId?: string;
      paymentMethodId?: string;
    };

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Confirm with Stripe if paymentMethodId is provided (some clients omit it)
    const confirmedIntent = paymentMethodId
      ? await StripeService.confirmPayment(paymentIntentId!, paymentMethodId)
      : { id: paymentIntentId };

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = confirmedIntent.id;
    await payment.save();

    // Update ride payment status
    await Ride.findByIdAndUpdate(payment.rideId, {
      paymentStatus: 'completed',
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment confirmed successfully',
      data: { payment },
    });
  }
);

// @desc    Handle Stripe webhook
// @route   POST /api/v1/payments/webhook
// @access  Public (Stripe only)
export const handleWebhook = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new AppError('Missing stripe signature', 400);
    }

    await StripeService.handleWebhook(req.body, signature);

    res.status(200).json({ received: true });
  }
);

// @desc    Request refund
// @route   POST /api/v1/payments/:id/refund
// @access  Private
export const requestRefund = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Verify ownership or admin
    if (
      payment.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('Not authorized', 403);
    }

    if (payment.status !== 'completed') {
      throw new AppError('Can only refund completed payments', 400);
    }

    // Process refund with Stripe
    const refund = await StripeService.refundPayment(
      payment.stripePaymentIntentId!,
      payment.amount,
      reason
    );

    // Update payment
    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundAmount = refund.amount;
    payment.refundReason = reason;
    await payment.save();

    // Update ride
    await Ride.findByIdAndUpdate(payment.rideId, {
      paymentStatus: 'refunded',
    });

    res.status(200).json({
      status: 'success',
      message: 'Refund processed successfully',
      data: { payment },
    });
  }
);

// @desc    Get payment history
// @route   GET /api/v1/payments
// @access  Private
export const getPaymentHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const limit = parseInt((req.query.limit as string) || '') || 10;
    const skipRaw = req.query.skip as string | undefined;
    const pageRaw = req.query.page as string | undefined;
    const page =
      typeof skipRaw === 'string'
        ? Math.floor((parseInt(skipRaw) || 0) / limit) + 1
        : parseInt(pageRaw || '') || 1;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Users see their own payments, drivers see their earnings
    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    } else if (req.user.role === 'driver') {
      // Payment.driverId stores the Driver profile id (not User id)
      // so drivers should use /drivers + ride linkage for earnings.
      // Keep empty filter here to avoid leaking others.
      filter.userId = req.user._id;
    }
    // Admins see all

    const payments = await Payment.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('rideId', 'pickupLocation dropoffLocation')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments,
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

// @desc    Get my payments as a plain list (mobile clients)
// @route   GET /api/v1/payments/my-payments
// @access  Private
export const getMyPaymentsList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '') || 20;
  const skip = parseInt((req.query.skip as string) || '') || 0;

  const payments = await Payment.find({ userId: req.user._id })
    .populate('rideId', 'pickupLocation dropoffLocation')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  // IMPORTANT: return a plain array (some clients expect List)
  res.status(200).json(payments);
});

// @desc    Get payment by ID
// @route   GET /api/v1/payments/:id
// @access  Private
export const getPaymentById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('driverId', 'vehicleNumber vehicleType')
      .populate('rideId');

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Verify access
    if (
      payment.userId.toString() !== req.user._id.toString() &&
      payment.driverId?.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new AppError('Not authorized', 403);
    }

    res.status(200).json({
      status: 'success',
      data: { payment },
    });
  }
);

// @desc    Get payment statistics
// @route   GET /api/v1/payments/stats
// @access  Private/Admin
export const getPaymentStats = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRefunds = await Payment.aggregate([
      { $match: { status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);

    const paymentMethodStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalTransactions = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: 'completed' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalRefunds: totalRefunds[0]?.total || 0,
        totalTransactions,
        successfulPayments,
        failedPayments,
        successRate: totalTransactions
          ? ((successfulPayments / totalTransactions) * 100).toFixed(2)
          : 0,
        paymentMethodStats,
      },
    });
  }
);

