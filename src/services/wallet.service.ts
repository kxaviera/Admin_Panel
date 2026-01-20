import mongoose from 'mongoose';
import Wallet from '../models/Wallet.model';
import WalletTransaction from '../models/WalletTransaction.model';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export class WalletService {
  /**
   * Get or create wallet for user
   */
  static async getOrCreateWallet(userId: mongoose.Types.ObjectId): Promise<any> {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        currency: 'INR',
      });
      logger.info(`Wallet created for user: ${userId}`);
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  static async getBalance(userId: mongoose.Types.ObjectId): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  /**
   * Credit amount to wallet
   */
  static async credit(
    userId: mongoose.Types.ObjectId,
    amount: number,
    transactionType: string,
    description: string,
    referenceId?: mongoose.Types.ObjectId,
    referenceModel?: string,
    metadata?: any
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await this.getOrCreateWallet(userId);

      if (!wallet.isActive) {
        throw new AppError('Wallet is not active', 400);
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      // Update wallet balance
      wallet.balance = balanceAfter;
      await wallet.save({ session });

      // Create transaction record
      const transaction = await WalletTransaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            type: 'credit',
            amount,
            balanceBefore,
            balanceAfter,
            transactionType,
            referenceId,
            referenceModel,
            description,
            status: 'completed',
            metadata,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      logger.info(`Credited ₹${amount / 100} to wallet: ${userId}`);

      return transaction[0];
    } catch (error: any) {
      await session.abortTransaction();
      logger.error(`Wallet credit error: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Debit amount from wallet
   */
  static async debit(
    userId: mongoose.Types.ObjectId,
    amount: number,
    transactionType: string,
    description: string,
    referenceId?: mongoose.Types.ObjectId,
    referenceModel?: string,
    metadata?: any
  ): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await this.getOrCreateWallet(userId);

      if (!wallet.isActive) {
        throw new AppError('Wallet is not active', 400);
      }

      const balanceBefore = wallet.balance;

      if (balanceBefore < amount) {
        throw new AppError('Insufficient wallet balance', 400);
      }

      const balanceAfter = balanceBefore - amount;

      // Update wallet balance
      wallet.balance = balanceAfter;
      await wallet.save({ session });

      // Create transaction record
      const transaction = await WalletTransaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            type: 'debit',
            amount,
            balanceBefore,
            balanceAfter,
            transactionType,
            referenceId,
            referenceModel,
            description,
            status: 'completed',
            metadata,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      logger.info(`Debited ₹${amount / 100} from wallet: ${userId}`);

      return transaction[0];
    } catch (error: any) {
      await session.abortTransaction();
      logger.error(`Wallet debit error: ${error.message}`);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transfer between wallets
   */
  static async transfer(
    fromUserId: mongoose.Types.ObjectId,
    toUserId: mongoose.Types.ObjectId,
    amount: number,
    description: string
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Debit from sender
      await this.debit(fromUserId, amount, 'withdrawal', description);

      // Credit to receiver
      await this.credit(toUserId, amount, 'top_up', description);

      await session.commitTransaction();
      logger.info(`Transferred ₹${amount / 100} from ${fromUserId} to ${toUserId}`);
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(
    userId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const transactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('referenceId');

    const total = await WalletTransaction.countDocuments({ userId });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process ride payment from wallet
   */
  static async processRidePayment(
    userId: mongoose.Types.ObjectId,
    rideId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<any> {
    return await this.debit(
      userId,
      amount,
      'ride_payment',
      `Payment for ride ${rideId}`,
      rideId,
      'Ride'
    );
  }

  /**
   * Process driver earning
   */
  static async processDriverEarning(
    driverId: mongoose.Types.ObjectId,
    rideId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<any> {
    return await this.credit(
      driverId,
      amount,
      'driver_earning',
      `Earning from ride ${rideId}`,
      rideId,
      'Ride'
    );
  }

  /**
   * Process refund
   */
  static async processRefund(
    userId: mongoose.Types.ObjectId,
    rideId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<any> {
    return await this.credit(
      userId,
      amount,
      'refund',
      `Refund for ride ${rideId}`,
      rideId,
      'Ride'
    );
  }

  /**
   * Process referral bonus
   */
  static async processReferralBonus(
    userId: mongoose.Types.ObjectId,
    referralId: mongoose.Types.ObjectId,
    amount: number
  ): Promise<any> {
    return await this.credit(
      userId,
      amount,
      'referral_bonus',
      'Referral bonus credited',
      referralId,
      'Referral'
    );
  }

  /**
   * Top up wallet (add money)
   */
  static async topUp(
    userId: mongoose.Types.ObjectId,
    amount: number,
    paymentId: string
  ): Promise<any> {
    return await this.credit(
      userId,
      amount,
      'top_up',
      'Wallet top-up',
      undefined,
      undefined,
      { paymentId }
    );
  }

  /**
   * Get wallet statistics
   */
  static async getWalletStats(userId: mongoose.Types.ObjectId): Promise<any> {
    const wallet = await this.getOrCreateWallet(userId);

    const stats = await WalletTransaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId as any) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalSpent = stats.find((s) => s._id === 'debit')?.total || 0;
    const totalReceived = stats.find((s) => s._id === 'credit')?.total || 0;

    return {
      currentBalance: wallet.balance,
      totalSpent,
      totalReceived,
      transactionCount: {
        credit: stats.find((s) => s._id === 'credit')?.count || 0,
        debit: stats.find((s) => s._id === 'debit')?.count || 0,
      },
    };
  }
}

