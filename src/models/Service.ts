import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  name: string;
  code: string;
  description?: string;
  category: 'ride' | 'parcel' | 'freight';
  vehicleType: string; // Made flexible to support any vehicle type
  icon?: string;
  iconSideView?: string;
  iconTopView?: string;
  iconFrontView?: string;
  image?: string;
  capacity: {
    passengers?: number;
    luggage?: number;
    weight?: number;
    maxWeight?: number;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  pricing: {
    baseFare: number;
    basePrice?: number;
    perKmRate: number;
    pricePerKm?: number;
    perMinuteRate: number;
    pricePerKg?: number;
    minimumFare: number;
    minimumPrice?: number;
    bookingFee: number;
    cancellationFee: number;
  };
  features: string[];
  isActive: boolean;
  availability: {
    days: string[];
    hours?: { start: string; end: string };
  };
  zones: mongoose.Types.ObjectId[];
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
    category: { type: String, enum: ['ride', 'parcel', 'freight'], required: true },
    vehicleType: {
      type: String,
      required: true,
      // No enum restriction - allows any vehicle type for flexibility
      // Common values: 'sedan', 'suv', 'auto', 'bike', 'luxury', 'van', 'truck', 'tempo', 'two wheeler', etc.
    },
    icon: String,
    iconSideView: String,
    iconTopView: String,
    iconFrontView: String,
    image: String,
    capacity: {
      passengers: Number,
      luggage: Number,
      weight: Number,
      maxWeight: Number,
      maxLength: Number,
      maxWidth: Number,
      maxHeight: Number,
    },
    pricing: {
      baseFare: { type: Number, default: 0 },
      basePrice: { type: Number, default: 0 },
      perKmRate: { type: Number, default: 0 },
      pricePerKm: { type: Number, default: 0 },
      perMinuteRate: { type: Number, default: 0 },
      pricePerKg: { type: Number, default: 0 },
      minimumFare: { type: Number, default: 0 },
      minimumPrice: { type: Number, default: 0 },
      bookingFee: { type: Number, default: 0 },
      cancellationFee: { type: Number, default: 0 },
    },
    features: [String],
    isActive: { type: Boolean, default: true },
    availability: {
      days: [String],
      hours: {
        start: String,
        end: String,
      },
    },
    zones: [{ type: Schema.Types.ObjectId, ref: 'Zone' }],
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ vehicleType: 1 });
ServiceSchema.index({ isActive: 1 });
ServiceSchema.index({ order: 1 });

export default mongoose.model<IService>('Service', ServiceSchema);

