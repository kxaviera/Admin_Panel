import mongoose, { Document, Schema } from 'mongoose';

export interface IDriverApplication extends Document {
  firstName: string;
  lastName: string;
  email?: string; // Optional - can be provided in profile info step
  phone?: string; // Optional - can be provided in profile info step
  serviceCategory: 'ride' | 'parcel' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  documents: {
    license: {
      url?: string;
      verified: boolean;
      verifiedBy?: mongoose.Types.ObjectId;
      verifiedAt?: Date;
    };
    aadhar: {
      url?: string;
      verified: boolean;
      verifiedBy?: mongoose.Types.ObjectId;
      verifiedAt?: Date;
    };
    photo: {
      url?: string;
      verified: boolean;
      verifiedBy?: mongoose.Types.ObjectId;
      verifiedAt?: Date;
    };
    backgroundCheck: {
      url?: string;
      verified: boolean;
      verifiedBy?: mongoose.Types.ObjectId;
      verifiedAt?: Date;
    };
  };
  vehicleDetails?: {
    vehicleType: 'bike' | 'auto' | 'sedan' | 'suv' | 'luxury';
    make: string;
    model: string;
    year: number;
    vehicleNumber: string;
    color: string;
    registrationDate?: Date;
    insurance?: {
      number: string;
      expiryDate: Date;
    };
    pollution?: {
      certificateNumber: string;
      expiryDate: Date;
    };
  };
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  driverId?: mongoose.Types.ObjectId; // Created driver ID after approval
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverApplicationSchema = new Schema<IDriverApplication>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: false }, // Optional - can be provided in profile info step
    phone: { type: String, required: false }, // Optional - can be provided in profile info step
    serviceCategory: {
      type: String,
      enum: ['ride', 'parcel', 'both'],
      default: 'ride',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    documents: {
      license: {
        url: String,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
      },
      aadhar: {
        url: String,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
      },
      photo: {
        url: String,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
      },
      backgroundCheck: {
        url: String,
        verified: { type: Boolean, default: false },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        verifiedAt: Date,
      },
    },
    vehicleDetails: {
      vehicleType: {
        type: String,
        enum: ['bike', 'auto', 'sedan', 'suv', 'luxury'],
      },
      make: String,
      model: String,
      year: Number,
      vehicleNumber: String,
      color: String,
      registrationDate: Date,
      insurance: {
        number: String,
        expiryDate: Date,
      },
      pollution: {
        certificateNumber: String,
        expiryDate: Date,
      },
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rejectionReason: String,
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
DriverApplicationSchema.index({ email: 1 });
DriverApplicationSchema.index({ phone: 1 });
DriverApplicationSchema.index({ status: 1 });
DriverApplicationSchema.index({ serviceCategory: 1 });
DriverApplicationSchema.index({ createdAt: -1 });
DriverApplicationSchema.index({ 'documents.license.verified': 1 });
DriverApplicationSchema.index({ 'documents.aadhar.verified': 1 });

export default mongoose.model<IDriverApplication>('DriverApplication', DriverApplicationSchema);

