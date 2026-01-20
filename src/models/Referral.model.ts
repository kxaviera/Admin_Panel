import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrerUserId: mongoose.Types.ObjectId;
  referralCode: string;
  referredUserId?: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'expired';
  rewardAmount: number;
  referrerReward: number;
  referredReward: number;
  referredAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending',
    },
    rewardAmount: {
      type: Number,
      default: 10000, // ₹100 in paise
    },
    referrerReward: {
      type: Number,
      default: 10000,
    },
    referredReward: {
      type: Number,
      default: 10000,
    },
    referredAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
referralSchema.index({ referrerUserId: 1, status: 1 });
referralSchema.index({ referredUserId: 1 });
referralSchema.index({ status: 1, expiresAt: 1 });

const Referral = mongoose.model<IReferral>('Referral', referralSchema);

export default Referral;

