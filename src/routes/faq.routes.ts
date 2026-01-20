import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { getFAQs, getFAQById, createFAQ, updateFAQ, deleteFAQ } from '../controllers/faq.controller';

const router = Router();

router.use(protect, restrictTo('admin'));
router.get('/', getFAQs);
router.get('/:id', getFAQById);
router.post('/', createFAQ);
router.put('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);

export default router;

