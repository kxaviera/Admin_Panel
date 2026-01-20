import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  code?: string; // Stable identifier for apps (e.g. STARTER_WELCOME)
  name: string;
  description: string;
  // Optional: link this plan to a specific Service (vehicle)
  serviceId?: mongoose.Types.ObjectId;
  // Which app flow this plan applies to
  appliesToCategory: 'ride' | 'parcel' | 'all';
  // Which vehicle type this plan applies to (matches Service.vehicleType / Driver.vehicleType)
  appliesToVehicleType: string; // e.g. 'bike', 'auto', 'sedan', ... or 'all'
  duration: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  // Optional override to support fixed-day plans (e.g. 30-day free trial)
  durationDays?: number;
  price: number;
  originalPrice?: number;
  currency: string;
  features: string[];
  maxRidesPerDay?: number;
  isActive: boolean;
  isPopular: boolean;
  isRecommended?: boolean;
  isBestValue?: boolean;
  isTrial?: boolean;
  sortOrder?: number;
  discount?: number;
  discountLabel?: string;
  stripePriceId?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },
    appliesToCategory: {
      type: String,
      enum: ['ride', 'parcel', 'all'],
      default: 'all',
      index: true,
    },
    appliesToVehicleType: {
      type: String,
      default: 'all',
      trim: true,
      lowercase: true,
      index: true,
    },
    duration: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: [true, 'Duration is required'],
    },
    durationDays: {
      type: Number,
      min: 1,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    features: [
      {
        type: String,
      },
    ],
    maxRidesPerDay: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isBestValue: {
      type: Boolean,
      default: false,
    },
    isTrial: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountLabel: {
      type: String,
      trim: true,
    },
    stripePriceId: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
subscriptionPlanSchema.index({ duration: 1, isActive: 1 });
subscriptionPlanSchema.index({ price: 1 });
subscriptionPlanSchema.index({ sortOrder: 1, isActive: 1 });
subscriptionPlanSchema.index({ appliesToCategory: 1, appliesToVehicleType: 1, duration: 1, isActive: 1 });

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);

export default SubscriptionPlan;

