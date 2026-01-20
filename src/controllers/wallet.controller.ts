import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { WalletService } from '../services/wallet.service';
import { StripeService } from '../services/stripe.service';
import Wallet from '../models/Wallet.model';

const toPaise = (amount: any): number => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // If it's already large (>= 10000) assume paise; else assume rupees.
  return Number.isInteger(n) && n >= 10000 ? n : Math.round(n * 100);
};

// @desc    Get wallet balance
// @route   GET /api/v1/wallet/balance
// @access  Private
export const getWalletBalance = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const balance = await WalletService.getBalance(req.user._id);

    res.status(200).json({
      status: 'success',
      data: {
        balance,
        balanceFormatted: `₹${balance / 100}`,
      },
    });
  }
);

// @desc    Get wallet details
// @route   GET /api/v1/wallet
// @access  Private
export const getWallet = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const wallet = await WalletService.getOrCreateWallet(req.user._id);

    res.status(200).json({
      status: 'success',
      data: { wallet },
    });
  }
);

// @desc    Top up wallet
// @route   POST /api/v1/wallet/top-up
// @access  Private
export const topUpWallet = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { amount } = req.body as any;

    const amountPaise = toPaise(amount);
    if (!amountPaise) {
      throw new AppError('Invalid amount', 400);
    }

    // Create Stripe payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      amountPaise,
      'inr',
      {
        userId: req.user._id.toString(),
        type: 'wallet_topup',
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Payment intent created',
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: amountPaise,
      },
    });
  }
);

// @desc    Confirm wallet top-up
// @route   POST /api/v1/wallet/confirm-top-up
// @access  Private
export const confirmTopUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { paymentIntentId, amount } = req.body as any;
    const amountPaise = toPaise(amount);

    // Record top-up in wallet
    const transaction = await WalletService.topUp(
      req.user._id,
      amountPaise,
      paymentIntentId
    );

    res.status(200).json({
      status: 'success',
      message: 'Wallet topped up successfully',
      data: { transaction },
    });
  }
);

// @desc    Get transaction history
// @route   GET /api/v1/wallet/transactions
// @access  Private
export const getTransactionHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const limit = parseInt((req.query.limit as string) || '') || 20;
    const skipRaw = req.query.skip as string | undefined;
    const pageRaw = req.query.page as string | undefined;
    const page =
      typeof skipRaw === 'string'
        ? Math.floor((parseInt(skipRaw) || 0) / limit) + 1
        : parseInt(pageRaw || '') || 1;

    const result = await WalletService.getTransactionHistory(
      req.user._id,
      page,
      limit
    );

    // Some mobile clients expect a plain List when using skip/limit.
    if (typeof skipRaw === 'string') {
      return res.status(200).json(result.transactions);
    }

    return res.status(200).json({
      status: 'success',
      results: result.transactions.length,
      data: result,
    });
  }
);

// @desc    Get wallet statistics
// @route   GET /api/v1/wallet/stats
// @access  Private
export const getWalletStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const stats = await WalletService.getWalletStats(req.user._id);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  }
);

// @desc    Withdraw from wallet
// @route   POST /api/v1/wallet/withdraw
// @access  Private/Driver
export const withdrawFromWallet = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { amount, bankAccountId, bankAccount } = req.body as any;
    const amountPaise = toPaise(amount);

    if (!amountPaise) {
      throw new AppError('Invalid amount', 400);
    }

    const balance = await WalletService.getBalance(req.user._id);

    if (balance < amountPaise) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    // Debit from wallet
    const transaction = await WalletService.debit(
      req.user._id,
      amountPaise,
      'withdrawal',
      `Withdrawal to bank account`,
      undefined,
      undefined,
      { bankAccountId, bankAccount }
    );

    // TODO: Process actual bank transfer via Stripe or payment gateway

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal request processed',
      data: { transaction },
    });
  }
);

// @desc    Get all wallets (Admin)
// @route   GET /api/v1/wallet/all
// @access  Private/Admin
export const getAllWallets = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const wallets = await Wallet.find()
      .populate('userId', 'firstName lastName email phone')
      .limit(limit)
      .skip(skip)
      .sort({ balance: -1 });

    const total = await Wallet.countDocuments();

    res.status(200).json({
      status: 'success',
      results: wallets.length,
      data: {
        wallets,
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

// @desc    Get wallet statistics (Admin)
// @route   GET /api/v1/wallet/admin/stats
// @access  Private/Admin
export const getAdminWalletStats = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const totalWallets = await Wallet.countDocuments();
    const activeWallets = await Wallet.countDocuments({ isActive: true });

    const balanceStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          avgBalance: { $avg: '$balance' },
          maxBalance: { $max: '$balance' },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalWallets,
        activeWallets,
        totalBalance: balanceStats[0]?.totalBalance || 0,
        avgBalance: balanceStats[0]?.avgBalance || 0,
        maxBalance: balanceStats[0]?.maxBalance || 0,
      },
    });
  }
);

