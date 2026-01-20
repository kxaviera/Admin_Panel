import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  fileName: string;
  originalName: string;
  fileType: 'image' | 'video' | 'document' | 'audio';
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnail?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByModel: 'User' | 'Driver' | 'Admin';
  category?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true, enum: ['image', 'video', 'document', 'audio'] },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    url: { type: String, required: true },
    thumbnail: String,
    uploadedBy: { type: Schema.Types.ObjectId, required: true, refPath: 'uploadedByModel' },
    uploadedByModel: { type: String, required: true, enum: ['User', 'Driver', 'Admin'] },
    category: String,
    tags: [String],
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ fileType: 1 });
MediaSchema.index({ category: 1 });
MediaSchema.index({ createdAt: -1 });

export default mongoose.model<IMedia>('Media', MediaSchema);

