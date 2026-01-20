import mongoose, { Document, Schema } from 'mongoose';

export interface IZone extends Document {
  name: string;
  code: string;
  description?: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  city: string;
  state: string;
  country: string;
  isActive: boolean;
  surgeMultiplier: number;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  availableServices: mongoose.Types.ObjectId[];
  restrictions?: string[];
  peakHours?: {
    start: string;
    end: string;
    multiplier: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
    geometry: {
      type: { type: String, enum: ['Polygon'], required: true },
      coordinates: { type: [[[Number]]], required: true },
    },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    surgeMultiplier: { type: Number, default: 1.0 },
    baseFare: { type: Number, required: true },
    perKmRate: { type: Number, required: true },
    perMinuteRate: { type: Number, required: true },
    availableServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    restrictions: [String],
    peakHours: [
      {
        start: String,
        end: String,
        multiplier: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
ZoneSchema.index({ city: 1 });
ZoneSchema.index({ isActive: 1 });
ZoneSchema.index({ geometry: '2dsphere' });

export default mongoose.model<IZone>('Zone', ZoneSchema);

