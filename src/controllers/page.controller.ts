import { Response } from 'express';
import Page from '../models/Page';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const getPages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.visibility) filter.visibility = String(req.query.visibility);
  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Page.find(filter).sort({ order: 1, updatedAt: -1 }).skip(skip).limit(limit),
    Page.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', data: { pages: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

export const getPageById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Page.findById(req.params.id);
  if (!doc) throw new AppError('Page not found', 404);
  res.status(200).json({ status: 'success', data: { page: doc } });
});

export const createPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, slug, content, status, visibility, template, seo, order, parentPage } = req.body || {};
  if (!title || !content) throw new AppError('title and content are required', 400);

  const finalSlug = slug ? String(slug) : slugify(String(title));
  const exists = await Page.exists({ slug: finalSlug });
  if (exists) throw new AppError('slug already exists', 400);

  const doc = await Page.create({
    title,
    slug: finalSlug.startsWith('/') ? finalSlug : `/${finalSlug}`,
    content,
    status: status || 'draft',
    visibility: visibility || 'public',
    template,
    seo,
    order: typeof order === 'number' ? order : 0,
    parentPage,
    publishedAt: status === 'published' ? new Date() : undefined,
  });

  res.status(201).json({ status: 'success', data: { page: doc } });
});

export const updatePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Page.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!doc) throw new AppError('Page not found', 404);
  res.status(200).json({ status: 'success', data: { page: doc } });
});

export const deletePage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Page.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Page not found', 404);
  res.status(200).json({ status: 'success', message: 'Page deleted' });
});

