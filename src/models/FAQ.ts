import mongoose, { Document, Schema } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  order?: number;
  status: 'active' | 'inactive';
  tags?: string[];
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    tags: [String],
    views: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
FAQSchema.index({ category: 1 });
FAQSchema.index({ status: 1 });
FAQSchema.index({ order: 1 });
FAQSchema.index({ tags: 1 });

export default mongoose.model<IFAQ>('FAQ', FAQSchema);

