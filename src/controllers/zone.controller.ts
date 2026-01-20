import { Response } from 'express';
import Zone from '../models/Zone';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const getZones = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const isActive = (req.query.isActive as string | undefined)?.trim();

  const filter: any = {};
  if (typeof isActive === 'string') filter.isActive = isActive === 'true';

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { code: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } },
    ];
  }

  const zones = await Zone.find(filter)
    .sort({ city: 1, name: 1 })
    .select('name code city state country isActive geometry surgeMultiplier baseFare perKmRate perMinuteRate');

  res.status(200).json({
    status: 'success',
    results: zones.length,
    data: { zones },
  });
});

