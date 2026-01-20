import mongoose, { Document, Schema } from 'mongoose';

export interface IParcel extends Document {
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  trackingNumber: string;
  pickupOtp: string;
  deliveryOtp: string;
  pickupLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  dropoffLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  parcelDetails: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    description: string;
    category: string;
    value?: number;
  };
  senderInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  recipientInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  fare: number;
  paymentMethod: 'cash' | 'card' | 'wallet';
  paymentStatus: 'pending' | 'completed' | 'failed';
  scheduledPickup?: Date;
  pickupTime?: Date;
  deliveryTime?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'user' | 'driver' | 'admin';
  cancellationReason?: string;
  notes?: string;
  images?: string[];
  signature?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParcelSchema = new Schema<IParcel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    trackingNumber: { type: String, required: true, unique: true },
    pickupOtp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    deliveryOtp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    pickupLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String, required: true },
    },
    dropoffLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String, required: true },
    },
    parcelDetails: {
      weight: { type: Number, required: true },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      description: { type: String, required: true },
      category: { type: String, required: true },
      value: Number,
    },
    senderInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
    },
    recipientInfo: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    fare: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'wallet'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    scheduledPickup: Date,
    pickupTime: Date,
    deliveryTime: Date,
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['user', 'driver', 'admin'] },
    cancellationReason: String,
    notes: String,
    images: [String],
    signature: String,
    rating: { type: Number, min: 1, max: 5 },
    review: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
ParcelSchema.index({ userId: 1 });
ParcelSchema.index({ driverId: 1 });
ParcelSchema.index({ status: 1 });
ParcelSchema.index({ createdAt: -1 });
ParcelSchema.index({ pickupLocation: '2dsphere' });
ParcelSchema.index({ dropoffLocation: '2dsphere' });

export default mongoose.model<IParcel>('Parcel', ParcelSchema);

