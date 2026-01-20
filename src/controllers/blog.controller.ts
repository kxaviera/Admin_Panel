import { Response } from 'express';
import Blog from '../models/Blog';
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

async function ensureUniqueSlug(base: string) {
  let slug = base || `post-${Date.now()}`;
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Blog.exists({ slug });
    if (!exists) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

export const getBlogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1;
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.category) filter.category = String(req.query.category);
  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { excerpt: { $regex: q, $options: 'i' } },
      { slug: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'firstName lastName email'),
    Blog.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: { blogs: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const getBlogById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Blog.findById(req.params.id).populate('author', 'firstName lastName email');
  if (!doc) throw new AppError('Blog not found', 404);
  res.status(200).json({ status: 'success', data: { blog: doc } });
});

export const createBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authorized', 401);
  const { title, content, excerpt, category, tags, status, featuredImage, seo } = req.body || {};
  if (!title || !content || !category) throw new AppError('title, content, category are required', 400);

  const baseSlug = slugify(String(title));
  const slug = await ensureUniqueSlug(baseSlug);

  const doc = await Blog.create({
    title,
    slug,
    content,
    excerpt,
    author: req.user._id,
    featuredImage,
    category,
    tags: Array.isArray(tags) ? tags : [],
    status: status || 'draft',
    seo: seo || undefined,
    publishedAt: status === 'published' ? new Date() : undefined,
  });

  res.status(201).json({ status: 'success', data: { blog: doc } });
});

export const updateBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const update: any = { ...req.body };
  // Prevent changing author directly
  delete update.author;
  const doc: any = await Blog.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
  if (!doc) throw new AppError('Blog not found', 404);
  res.status(200).json({ status: 'success', data: { blog: doc } });
});

export const deleteBlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const doc = await Blog.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError('Blog not found', 404);
  res.status(200).json({ status: 'success', message: 'Blog deleted' });
});

