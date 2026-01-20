import mongoose, { Document, Schema } from 'mongoose';

export interface IFreight extends Document {
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  trackingNumber: string;
  pickupLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
    contact: { name: string; phone: string };
  };
  dropoffLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
    contact: { name: string; phone: string };
  };
  freightDetails: {
    weight: number;
    volume: number;
    dimensions: { length: number; width: number; height: number };
    description: string;
    category: string;
    goodsType: string;
    quantity: number;
    value: number;
  };
  vehicleType: 'truck' | 'van' | 'flatbed' | 'container';
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  fare: number;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'invoice';
  paymentStatus: 'pending' | 'completed' | 'failed';
  scheduledPickup?: Date;
  pickupTime?: Date;
  deliveryTime?: Date;
  estimatedDelivery?: Date;
  notes?: string;
  documents?: string[];
  images?: string[];
  signature?: string;
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FreightSchema = new Schema<IFreight>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    trackingNumber: { type: String, required: true, unique: true },
    pickupLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String, required: true },
      contact: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
      },
    },
    dropoffLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: { type: String, required: true },
      contact: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
      },
    },
    freightDetails: {
      weight: { type: Number, required: true },
      volume: { type: Number, required: true },
      dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
      },
      description: { type: String, required: true },
      category: { type: String, required: true },
      goodsType: { type: String, required: true },
      quantity: { type: Number, required: true },
      value: { type: Number, required: true },
    },
    vehicleType: { type: String, enum: ['truck', 'van', 'flatbed', 'container'], required: true },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    fare: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'wallet', 'invoice'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    scheduledPickup: Date,
    pickupTime: Date,
    deliveryTime: Date,
    estimatedDelivery: Date,
    notes: String,
    documents: [String],
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
FreightSchema.index({ userId: 1 });
FreightSchema.index({ driverId: 1 });
FreightSchema.index({ status: 1 });
FreightSchema.index({ createdAt: -1 });
FreightSchema.index({ pickupLocation: '2dsphere' });
FreightSchema.index({ dropoffLocation: '2dsphere' });

export default mongoose.model<IFreight>('Freight', FreightSchema);

