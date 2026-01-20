import mongoose, { Document, Schema } from 'mongoose';

export interface IDispatcher extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string;
  employeeId: string;
  zone?: mongoose.Types.ObjectId;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  shift?: {
    start: string;
    end: string;
  };
  assignedRides: number;
  completedRides: number;
  rating?: number;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DispatcherSchema = new Schema<IDispatcher>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    employeeId: { type: String, required: true, unique: true },
    zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
    permissions: [String],
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    shift: {
      start: String,
      end: String,
    },
    assignedRides: { type: Number, default: 0 },
    completedRides: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5 },
    lastActive: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
DispatcherSchema.index({ status: 1 });
DispatcherSchema.index({ zone: 1 });

export default mongoose.model<IDispatcher>('Dispatcher', DispatcherSchema);

