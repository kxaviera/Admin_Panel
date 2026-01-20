import mongoose, { Document, Schema } from 'mongoose';

export interface IPromoUsage extends Document {
  promoCodeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rideId: mongoose.Types.ObjectId;
  discountAmount: number;
  usedAt: Date;
}

const promoUsageSchema = new Schema<IPromoUsage>(
  {
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'PromoCode',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
promoUsageSchema.index({ promoCodeId: 1, userId: 1 });
promoUsageSchema.index({ userId: 1, usedAt: -1 });
promoUsageSchema.index({ rideId: 1 });

const PromoUsage = mongoose.model<IPromoUsage>('PromoUsage', promoUsageSchema);

export default PromoUsage;

