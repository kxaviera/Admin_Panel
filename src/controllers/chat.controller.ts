import { Response } from 'express';
import Chat from '../models/Chat';
import Driver from '../models/Driver.model';
import Ride from '../models/Ride.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const getChats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '30'), 10) || 30;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.isActive !== undefined) filter.isActive = String(req.query.isActive) === 'true';

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { lastMessage: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Chat.find(filter)
      .sort({ lastMessageTime: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('participants.user', 'firstName lastName phone')
      .populate({
        path: 'participants.driver',
        populate: { path: 'userId', select: 'firstName lastName phone' },
      })
      .populate('ride', 'status pickupLocation dropoffLocation')
      .select('participants ride lastMessage lastMessageTime unreadCount isActive createdAt updatedAt'),
    Chat.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      chats: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

export const getChatByRide = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authorized', 401);

  const rideId = String(req.params.rideId || '').trim();
  if (!rideId) throw new AppError('rideId is required', 400);

  const ride: any = await Ride.findById(rideId).select('userId driverId status');
  if (!ride) throw new AppError('Ride not found', 404);

  // Determine caller identity
  const role = req.user.role;
  let driverProfileId: string | null = null;
  if (role === 'driver') {
    const driverProfile = await Driver.findOne({ userId: req.user._id }).select('_id');
    if (!driverProfile) throw new AppError('Driver profile not found', 404);
    driverProfileId = driverProfile._id.toString();
  }

  // Authorization: user can only access own ride; driver can only access assigned ride; admin all
  if (role === 'user') {
    if (ride.userId?.toString?.() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }
  } else if (role === 'driver') {
    if (!ride.driverId) throw new AppError('Chat available after ride is accepted', 400);
    if (ride.driverId?.toString?.() !== driverProfileId) {
      throw new AppError('Not authorized', 403);
    }
  } else if (role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  // Only allow creating chat once driver assigned (ride accepted)
  if (!ride.driverId) {
    throw new AppError('Chat available after ride is accepted', 400);
  }

  const chat: any = await Chat.findOneAndUpdate(
    { ride: ride._id },
    {
      $setOnInsert: {
        participants: { user: ride.userId, driver: ride.driverId },
        ride: ride._id,
        messages: [],
        unreadCount: { user: 0, driver: 0 },
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('participants.user', 'firstName lastName phone')
    .populate({
      path: 'participants.driver',
      populate: { path: 'userId', select: 'firstName lastName phone' },
    })
    .populate('ride', 'status pickupLocation dropoffLocation');

  res.status(200).json({
    status: 'success',
    data: { chat },
  });
});

export const getChatById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = parseInt(String(req.query.limit || '100'), 10) || 100;

  const chat: any = await Chat.findById(req.params.id)
    .populate('participants.user', 'firstName lastName phone')
    .populate({
      path: 'participants.driver',
      populate: { path: 'userId', select: 'firstName lastName phone' },
    })
    .populate('ride', 'status pickupLocation dropoffLocation');

  if (!chat) throw new AppError('Chat not found', 404);

  // Access control: admin can view all; user/driver only if participant
  if (req.user?.role !== 'admin') {
    if (!req.user) throw new AppError('Not authorized', 401);
    if (req.user.role === 'user') {
      if (chat.participants?.user?.toString?.() !== req.user._id.toString()) {
        throw new AppError('Not authorized', 403);
      }
    } else if (req.user.role === 'driver') {
      const driverProfile = await Driver.findOne({ userId: req.user._id }).select('_id');
      if (!driverProfile) throw new AppError('Driver profile not found', 404);
      if (chat.participants?.driver?.toString?.() !== driverProfile._id.toString()) {
        throw new AppError('Not authorized', 403);
      }
    } else {
      throw new AppError('Not authorized', 403);
    }
  }

  // Return only last N messages for performance
  const msgs = Array.isArray(chat.messages) ? chat.messages.slice(-limit) : [];
  chat.messages = msgs;

  res.status(200).json({
    status: 'success',
    data: { chat },
  });
});

export const sendChatMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authorized', 401);
  const { message, attachments } = req.body || {};
  const text = String(message || '').trim();
  if (!text) throw new AppError('message is required', 400);

  const chat: any = await Chat.findById(req.params.id);
  if (!chat) throw new AppError('Chat not found', 404);

  const senderModel: 'User' | 'Driver' = req.user.role === 'driver' ? 'Driver' : 'User';
  let senderId: any = req.user._id;

  if (senderModel === 'Driver') {
    const driverProfile = await Driver.findOne({ userId: req.user._id });
    if (!driverProfile) throw new AppError('Driver profile not found', 404);
    senderId = driverProfile._id;
  }

  // Only participants (or admin) can send
  if (req.user.role !== 'admin') {
    const participantUserId = chat.participants?.user?.toString?.();
    const participantDriverId = chat.participants?.driver?.toString?.();
    if (senderModel === 'User') {
      if (!participantUserId || participantUserId !== req.user._id.toString()) {
        throw new AppError('Not authorized', 403);
      }
    } else if (senderModel === 'Driver') {
      if (!participantDriverId || participantDriverId !== senderId.toString()) {
        throw new AppError('Not authorized', 403);
      }
    }
  }

  const msg = {
    sender: senderId,
    senderModel,
    message: text,
    timestamp: new Date(),
    read: false,
    attachments: Array.isArray(attachments) ? attachments : [],
  };

  chat.messages.push(msg);
  chat.lastMessage = text;
  chat.lastMessageTime = new Date();

  // unread count logic:
  const participantUserId = chat.participants?.user?.toString?.();
  const participantDriverId = chat.participants?.driver?.toString?.();
  if (senderModel === 'User' && participantUserId && participantUserId === req.user._id.toString()) {
    chat.unreadCount.driver = (chat.unreadCount.driver || 0) + 1;
  } else if (senderModel === 'Driver' && participantDriverId && participantDriverId === senderId.toString()) {
    chat.unreadCount.user = (chat.unreadCount.user || 0) + 1;
  } else {
    // Admin/support message (not matching either participant) => bump both
    chat.unreadCount.user = (chat.unreadCount.user || 0) + 1;
    chat.unreadCount.driver = (chat.unreadCount.driver || 0) + 1;
  }

  await chat.save();

  // Emit realtime to participants if connected
  const io = (req as any).app?.get?.('io');
  if (io) {
    try {
      // user room expects User._id
      if (chat.participants?.user) {
        io.to(`user:${chat.participants.user.toString()}`).emit('chat:message', {
          chatId: chat._id.toString(),
          message: msg,
        });
      }
      if (chat.participants?.driver) {
        const driverProfile: any = await Driver.findById(chat.participants.driver).select('userId');
        if (driverProfile?.userId) {
          io.to(`user:${driverProfile.userId.toString()}`).emit('chat:message', {
            chatId: chat._id.toString(),
            message: msg,
          });
        }
      }
    } catch (_) {
      // non-fatal
    }
  }

  res.status(201).json({
    status: 'success',
    data: { message: msg },
  });
});

