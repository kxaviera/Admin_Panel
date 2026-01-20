import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getFleetManagers,
  getFleetManagerById,
  createFleetManager,
  updateFleetManager,
  deleteFleetManager,
  resetFleetManagerPassword,
} from '../controllers/fleetManager.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getFleetManagers);
router.get('/:id', getFleetManagerById);
router.post('/', createFleetManager);
router.put('/:id', updateFleetManager);
router.patch('/:id/reset-password', resetFleetManagerPassword);
router.delete('/:id', deleteFleetManager);

export default router;

