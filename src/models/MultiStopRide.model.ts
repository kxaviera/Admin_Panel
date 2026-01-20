import mongoose, { Document, Schema } from 'mongoose';

export interface IMultiStopRide extends Document {
  rideId: mongoose.Types.ObjectId;
  stops: Array<{
    location: {
      type: string;
      coordinates: [number, number];
      address: string;
    };
    order: number;
    reached: boolean;
    reachedAt?: Date;
  }>;
  totalDistance: number;
  totalDuration: number;
  additionalFare: number;
  createdAt: Date;
  updatedAt: Date;
}

const multiStopRideSchema = new Schema<IMultiStopRide>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      unique: true,
    },
    stops: [
      {
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number],
            required: true,
          },
          address: {
            type: String,
            required: true,
          },
        },
        order: {
          type: Number,
          required: true,
        },
        reached: {
          type: Boolean,
          default: false,
        },
        reachedAt: Date,
      },
    ],
    totalDistance: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    additionalFare: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// No manual index needed for rideId as it is already marked unique: true

const MultiStopRide = mongoose.model<IMultiStopRide>('MultiStopRide', multiStopRideSchema);

export default MultiStopRide;

