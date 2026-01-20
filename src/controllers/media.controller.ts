import { Response } from 'express';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const getMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '50'), 10) || 50;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.fileType) filter.fileType = String(req.query.fileType);
  if (req.query.isPublic !== undefined) filter.isPublic = String(req.query.isPublic) === 'true';

  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { fileName: { $regex: q, $options: 'i' } },
      { originalName: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Media.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', data: { media: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const createMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authorized', 401);
  const { fileName, originalName, fileType, mimeType, fileSize, url, thumbnail, category, tags, isPublic } = req.body || {};
  if (!fileName || !originalName || !fileType || !mimeType || !fileSize || !url) {
    throw new AppError('fileName, originalName, fileType, mimeType, fileSize, url are required', 400);
  }

  const doc = await Media.create({
    fileName,
    originalName,
    fileType,
    mimeType,
    fileSize,
    url,
    thumbnail,
    uploadedBy: req.user._id,
    // Use User model even for admin accounts (Admin model does not exist)
    uploadedByModel: 'User',
    category,
    tags: Array.isArray(tags) ? tags : [],
    isPublic: Boolean(isPublic),
  });

  res.status(201).json({ status: 'success', data: { media: doc } });
});

export const deleteMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Media.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Media not found', 404);
  res.status(200).json({ status: 'success', message: 'Media deleted' });
});

