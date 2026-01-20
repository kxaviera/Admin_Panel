import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: mongoose.Types.ObjectId;
  featuredImage?: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  views: number;
  likes: number;
  comments?: {
    user: mongoose.Types.ObjectId;
    comment: string;
    date: Date;
  }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: String,
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    featuredImage: String,
    category: { type: String, required: true },
    tags: [String],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        comment: String,
        date: { type: Date, default: Date.now },
      },
    ],
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
BlogSchema.index({ author: 1 });
BlogSchema.index({ category: 1 });
BlogSchema.index({ status: 1 });
BlogSchema.index({ publishedAt: -1 });
BlogSchema.index({ tags: 1 });

export default mongoose.model<IBlog>('Blog', BlogSchema);

