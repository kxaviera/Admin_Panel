import mongoose, { Document, Schema } from 'mongoose';

export interface ISOS extends Document {
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  rideId?: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'responded' | 'resolved' | 'cancelled';
  reason: string;
  description?: string;
  location: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  userPhone: string;
  driverPhone?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  emergencyServices: {
    police?: boolean;
    ambulance?: boolean;
    fire?: boolean;
  };
  notes?: string;
  audioRecording?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SOSSchema = new Schema<ISOS>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    rideId: { type: Schema.Types.ObjectId, ref: 'Ride' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'responded', 'resolved', 'cancelled'],
      default: 'active',
      required: true,
    },
    reason: { type: String, required: true },
    description: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    userPhone: { type: String, required: true },
    driverPhone: String,
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    emergencyServices: {
      police: { type: Boolean, default: false },
      ambulance: { type: Boolean, default: false },
      fire: { type: Boolean, default: false },
    },
    notes: String,
    audioRecording: String,
    images: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
SOSSchema.index({ userId: 1 });
SOSSchema.index({ driverId: 1 });
SOSSchema.index({ rideId: 1 });
SOSSchema.index({ status: 1 });
SOSSchema.index({ priority: 1 });
SOSSchema.index({ createdAt: -1 });
SOSSchema.index({ location: '2dsphere' });

export default mongoose.model<ISOS>('SOS', SOSSchema);

