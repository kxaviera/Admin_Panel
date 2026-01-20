import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  updateMyProfile,
  updateMyLocation,
} from '../controllers/user.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Stats route (admin only)
router.get('/stats', restrictTo('admin'), getUserStats);

// Mobile convenience routes
router.put('/profile', updateMyProfile);
router.put('/location', updateMyLocation);

// CRUD routes
router.get('/', restrictTo('admin'), getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

export default router;

