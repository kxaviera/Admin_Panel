import mongoose, { Document, Schema } from 'mongoose';

export interface IDriver extends Document {
  userId: mongoose.Types.ObjectId;
  licenseNumber: string;
  licenseExpiry: Date;
  vehicleType: 'sedan' | 'suv' | 'auto' | 'bike' | 'luxury';
  vehicleModel: string;
  vehicleMake: string;
  vehicleYear: number;
  vehicleColor: string;
  vehicleNumber: string;
  vehicleImages?: string[];
  documentsVerified: boolean;
  documents: {
    license?: string;
    vehicleRC?: string;
    insurance?: string;
    pollutionCertificate?: string;
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  currentLocation?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  isOnline: boolean;
  isAvailable: boolean;
  currentRide?: mongoose.Types.ObjectId;
  // How far (km) the driver wants to receive nearby jobs (rides/parcels).
  // Used as default for /rides/available and /parcels/available when radiusKm is not provided.
  searchRadiusKm?: number;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  completionRate: number;
  acceptanceRate: number;
  cancellationRate: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      uppercase: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'auto', 'bike', 'luxury'],
      required: [true, 'Vehicle type is required'],
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
    },
    vehicleMake: {
      type: String,
      required: [true, 'Vehicle make is required'],
    },
    vehicleYear: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: 2000,
    },
    vehicleColor: {
      type: String,
      required: [true, 'Vehicle color is required'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      unique: true,
      uppercase: true,
    },
    vehicleImages: [String],
    documentsVerified: {
      type: Boolean,
      default: false,
    },
    documents: {
      license: String,
      vehicleRC: String,
      insurance: String,
      pollutionCertificate: String,
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentRide: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
    },
    searchRadiusKm: {
      type: Number,
      default: 5,
      min: 0.5,
      max: 50,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    acceptanceRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    cancellationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial index for location queries
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ isOnline: 1, isAvailable: 1, status: 1 });

const Driver = mongoose.model<IDriver>('Driver', driverSchema);

export default Driver;

