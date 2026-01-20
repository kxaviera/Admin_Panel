import mongoose, { Document, Schema } from 'mongoose';

export interface IFleetManager extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string;
  employeeId: string;
  company?: string;
  zone?: mongoose.Types.ObjectId;
  managedVehicles: mongoose.Types.ObjectId[];
  managedDrivers: mongoose.Types.ObjectId[];
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const FleetManagerSchema = new Schema<IFleetManager>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    employeeId: { type: String, required: true, unique: true },
    company: String,
    zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
    managedVehicles: [{ type: Schema.Types.ObjectId, ref: 'FleetVehicle' }],
    managedDrivers: [{ type: Schema.Types.ObjectId, ref: 'Driver' }],
    permissions: [String],
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    rating: { type: Number, min: 1, max: 5 },
  },
  {
    timestamps: true,
  }
);

// Indexes
FleetManagerSchema.index({ status: 1 });

export default mongoose.model<IFleetManager>('FleetManager', FleetManagerSchema);

