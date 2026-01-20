import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getMedia, createMedia, deleteMedia } from '../controllers/media.controller';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', getMedia);
router.post('/', createMedia);
router.delete('/:id', deleteMedia);

export default router;

