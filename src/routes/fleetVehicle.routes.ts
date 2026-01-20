import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import {
  getFleetVehicles,
  getFleetVehicleById,
  createFleetVehicle,
  updateFleetVehicle,
  deleteFleetVehicle,
} from '../controllers/fleetVehicle.controller';

const router = Router();

router.use(protect, restrictTo('admin'));

router.get('/', getFleetVehicles);
router.get('/:id', getFleetVehicleById);
router.post('/', createFleetVehicle);
router.put('/:id', updateFleetVehicle);
router.delete('/:id', deleteFleetVehicle);

export default router;

