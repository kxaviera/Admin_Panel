import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getDispatchers,
  getDispatcherById,
  createDispatcher,
  updateDispatcher,
  resetDispatcherPassword,
  deleteDispatcher,
} from '../controllers/dispatcher.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getDispatchers);
router.get('/:id', getDispatcherById);
router.post('/', createDispatcher);
router.put('/:id', updateDispatcher);
router.patch('/:id/reset-password', resetDispatcherPassword);
router.delete('/:id', deleteDispatcher);

export default router;

