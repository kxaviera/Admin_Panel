import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import DriverApplication from '../models/DriverApplication';

export const getDriverApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const status = (req.query.status as string | undefined)?.trim();
  const serviceCategory = (req.query.serviceCategory as string | undefined)?.trim();
  const q = (req.query.q as string | undefined)?.trim();
  const from = (req.query.from as string | undefined)?.trim();
  const to = (req.query.to as string | undefined)?.trim();

  const filter: any = {};
  if (status) filter.status = status;
  if (serviceCategory) filter.serviceCategory = serviceCategory;

  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const applications = await DriverApplication.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await DriverApplication.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: applications.length,
    data: {
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

