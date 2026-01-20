import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } from '../controllers/blog.controller';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;

