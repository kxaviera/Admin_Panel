import { Response } from 'express';
import FAQ from '../models/FAQ';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const getFAQs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '50'), 10) || 50;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.category) filter.category = String(req.query.category);
  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { question: { $regex: q, $options: 'i' } },
      { answer: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    FAQ.find(filter).sort({ order: 1, updatedAt: -1 }).skip(skip).limit(limit),
    FAQ.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', data: { faqs: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const getFAQById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FAQ.findById(req.params.id);
  if (!doc) throw new AppError('FAQ not found', 404);
  res.status(200).json({ status: 'success', data: { faq: doc } });
});

export const createFAQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { question, answer, category, status, tags, order } = req.body || {};
  if (!question || !answer || !category) throw new AppError('question, answer, category are required', 400);
  const doc = await FAQ.create({
    question,
    answer,
    category,
    status: status || 'active',
    tags: Array.isArray(tags) ? tags : [],
    order: typeof order === 'number' ? order : 0,
  });
  res.status(201).json({ status: 'success', data: { faq: doc } });
});

export const updateFAQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FAQ.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!doc) throw new AppError('FAQ not found', 404);
  res.status(200).json({ status: 'success', data: { faq: doc } });
});

export const deleteFAQ = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await FAQ.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('FAQ not found', 404);
  res.status(200).json({ status: 'success', message: 'FAQ deleted' });
});

