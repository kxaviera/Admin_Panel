import mongoose, { Document, Schema } from 'mongoose';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  transactionType:
    | 'ride_payment'
    | 'refund'
    | 'top_up'
    | 'withdrawal'
    | 'referral_bonus'
    | 'promo_credit'
    | 'driver_earning'
    | 'subscription';
  referenceId?: mongoose.Types.ObjectId;
  referenceModel?: 'Ride' | 'Payment' | 'Referral' | 'PromoCode' | 'SubscriptionPlan' | 'DriverSubscription';
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: [
        'ride_payment',
        'refund',
        'top_up',
        'withdrawal',
        'referral_bonus',
        'promo_credit',
        'driver_earning',
        'subscription',
      ],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      refPath: 'referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Ride', 'Payment', 'Referral', 'PromoCode', 'SubscriptionPlan', 'DriverSubscription'],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ referenceId: 1, referenceModel: 1 });

const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  walletTransactionSchema
);

export default WalletTransaction;

