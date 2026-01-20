import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  senderModel: 'User' | 'Driver';
  message: string;
  timestamp: Date;
  read: boolean;
  attachments?: string[];
}

export interface IChat extends Document {
  participants: {
    user?: mongoose.Types.ObjectId;
    driver?: mongoose.Types.ObjectId;
  };
  ride?: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: {
    user: number;
    driver: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
  senderModel: { type: String, required: true, enum: ['User', 'Driver'] },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  attachments: [{ type: String }],
});

const ChatSchema = new Schema<IChat>(
  {
    participants: {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      driver: { type: Schema.Types.ObjectId, ref: 'Driver' },
    },
    ride: { type: Schema.Types.ObjectId, ref: 'Ride' },
    messages: [MessageSchema],
    lastMessage: String,
    lastMessageTime: Date,
    unreadCount: {
      user: { type: Number, default: 0 },
      driver: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatSchema.index({ 'participants.user': 1 });
ChatSchema.index({ 'participants.driver': 1 });
ChatSchema.index({ ride: 1 });
ChatSchema.index({ lastMessageTime: -1 });

export default mongoose.model<IChat>('Chat', ChatSchema);

