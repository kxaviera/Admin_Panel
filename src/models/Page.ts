import mongoose, { Document, Schema } from 'mongoose';

export interface IPage extends Document {
  title: string;
  slug: string;
  content: string;
  template?: string;
  status: 'draft' | 'published' | 'archived';
  parentPage?: mongoose.Types.ObjectId;
  order?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  visibility: 'public' | 'private' | 'protected';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    template: String,
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    parentPage: { type: Schema.Types.ObjectId, ref: 'Page' },
    order: { type: Number, default: 0 },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    visibility: { type: String, enum: ['public', 'private', 'protected'], default: 'public' },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
PageSchema.index({ status: 1 });
PageSchema.index({ visibility: 1 });
PageSchema.index({ order: 1 });

export default mongoose.model<IPage>('Page', PageSchema);

