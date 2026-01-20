import mongoose, { Document, Schema } from 'mongoose';

export interface IDriverSubscription extends Document {
  driverId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: 'wallet' | 'card' | 'upi' | 'cash' | 'free';
  // For wallet payments we store WalletTransaction; for card/upi we store Payment
  paymentRefId?: mongoose.Types.ObjectId;
  paymentRefModel?: 'Payment' | 'WalletTransaction';
  ridesCompleted: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

const driverSubscriptionSchema = new Schema<IDriverSubscription>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'pending',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['wallet', 'card', 'upi', 'cash', 'free'],
      required: true,
    },
    paymentRefId: {
      type: Schema.Types.ObjectId,
      refPath: 'paymentRefModel',
    },
    paymentRefModel: {
      type: String,
      enum: ['Payment', 'WalletTransaction'],
    },
    ridesCompleted: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
driverSubscriptionSchema.index({ driverId: 1, status: 1 });
driverSubscriptionSchema.index({ endDate: 1, status: 1 });
driverSubscriptionSchema.index({ planId: 1 });

// Check if subscription is expired
driverSubscriptionSchema.methods.isExpired = function (): boolean {
  return new Date() > this.endDate;
};

// Check if subscription is valid
driverSubscriptionSchema.methods.isValid = function (): boolean {
  return this.status === 'active' && !this.isExpired();
};

const DriverSubscription = mongoose.model<IDriverSubscription>(
  'DriverSubscription',
  driverSubscriptionSchema
);

export default DriverSubscription;

