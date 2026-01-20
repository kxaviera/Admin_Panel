import mongoose, { Document, Schema } from 'mongoose';

export interface IRide extends Document {
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  pickupLocation: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  dropoffLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  vehicleType: 'sedan' | 'suv' | 'auto' | 'bike' | 'luxury';
  status: 'requested' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled';
  fare: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    bookingFee: number;
    surgeFare: number;
    totalFare: number;
    discount: number;
    finalFare: number;
  };
  distance?: number; // in kilometers
  duration?: number; // in minutes
  estimatedFare: number;
  promoCode?: string;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'upi';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  rating?: {
    userRating?: number;
    driverRating?: number;
    userReview?: string;
    driverReview?: string;
  };
  scheduledTime?: Date;
  requestedAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'user' | 'driver' | 'admin';
  cancellationReason?: string;
  route?: {
    type: string;
    coordinates: [[number, number]];
  };
  otp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rideSchema = new Schema<IRide>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Pickup coordinates are required'],
      },
      address: {
        type: String,
        required: [true, 'Pickup address is required'],
      },
    },
    dropoffLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: [true, 'Dropoff coordinates are required'],
      },
      address: {
        type: String,
        required: [true, 'Dropoff address is required'],
      },
    },
    vehicleType: {
      type: String,
      enum: ['sedan', 'suv', 'auto', 'bike', 'luxury'],
      required: [true, 'Vehicle type is required'],
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'arrived', 'started', 'completed', 'cancelled'],
      default: 'requested',
    },
    fare: {
      baseFare: { type: Number, default: 0 },
      distanceFare: { type: Number, default: 0 },
      timeFare: { type: Number, default: 0 },
      bookingFee: { type: Number, default: 0 },
      surgeFare: { type: Number, default: 0 },
      totalFare: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      finalFare: { type: Number, default: 0 },
    },
    distance: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    estimatedFare: {
      type: Number,
      required: true,
    },
    promoCode: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet', 'upi'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    rating: {
      userRating: { type: Number, min: 1, max: 5 },
      driverRating: { type: Number, min: 1, max: 5 },
      userReview: String,
      driverReview: String,
    },
    scheduledTime: {
      type: Date,
      default: null,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    arrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['user', 'driver', 'admin'],
    },
    cancellationReason: String,
    route: {
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString',
      },
      coordinates: [[Number]],
    },
    otp: {
      type: String,
      default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial indexes
rideSchema.index({ 'pickupLocation': '2dsphere' });
rideSchema.index({ 'dropoffLocation': '2dsphere' });

// Regular indexes
rideSchema.index({ userId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index({ status: 1, requestedAt: -1 });
rideSchema.index({ createdAt: -1 });

const Ride = mongoose.model<IRide>('Ride', rideSchema);

export default Ride;

