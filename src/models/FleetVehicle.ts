import mongoose, { Schema } from 'mongoose';

export interface IFleetVehicle {
  fleetNumber: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicleType: 'sedan' | 'suv' | 'auto' | 'bike' | 'luxury' | 'van' | 'truck';
  assignedDriver?: mongoose.Types.ObjectId;
  fleetManager?: mongoose.Types.ObjectId;
  status: 'available' | 'assigned' | 'in_service' | 'maintenance' | 'retired';
  documents: {
    registration?: string;
    insurance?: string;
    permit?: string;
    pollution?: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
  };
  maintenance: {
    lastService?: Date;
    nextService?: Date;
    mileage?: number;
    notes?: string;
  };
  features?: string[];
  images?: string[];
  currentLocation?: {
    type: string;
    coordinates: [number, number];
  };
  totalRides: number;
  totalRevenue: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FleetVehicleSchema = new Schema<IFleetVehicle>(
  {
    fleetNumber: { type: String, required: true, unique: true },
    vehicleNumber: { type: String, required: true, unique: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    vehicleType: {
      type: String,
      required: true,
      enum: ['sedan', 'suv', 'auto', 'bike', 'luxury', 'van', 'truck'],
    },
    assignedDriver: { type: Schema.Types.ObjectId, ref: 'Driver' },
    fleetManager: { type: Schema.Types.ObjectId, ref: 'FleetManager' },
    status: {
      type: String,
      enum: ['available', 'assigned', 'in_service', 'maintenance', 'retired'],
      default: 'available',
    },
    documents: {
      registration: String,
      insurance: String,
      permit: String,
      pollution: String,
    },
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
    },
    maintenance: {
      lastService: Date,
      nextService: Date,
      mileage: Number,
      notes: String,
    },
    features: [String],
    images: [String],
    currentLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
    totalRides: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
  },
  {
    timestamps: true,
  }
);

// Indexes
FleetVehicleSchema.index({ assignedDriver: 1 });
FleetVehicleSchema.index({ fleetManager: 1 });
FleetVehicleSchema.index({ status: 1 });
FleetVehicleSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model<IFleetVehicle>('FleetVehicle', FleetVehicleSchema);

