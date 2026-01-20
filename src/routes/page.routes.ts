import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getPages, getPageById, createPage, updatePage, deletePage } from '../controllers/page.controller';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', getPages);
router.get('/:id', getPageById);
router.post('/', createPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

export default router;

