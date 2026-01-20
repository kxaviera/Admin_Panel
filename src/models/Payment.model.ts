import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  rideId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'card' | 'wallet' | 'upi';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  stripePaymentIntentId?: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: {
    cardLast4?: string;
    cardBrand?: string;
    upiId?: string;
    walletType?: string;
  };
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet', 'upi'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    refundId: {
      type: String,
      unique: true,
      sparse: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    refundReason: String,
    metadata: {
      cardLast4: String,
      cardBrand: String,
      upiId: String,
      walletType: String,
    },
    failureReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ rideId: 1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ driverId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;

