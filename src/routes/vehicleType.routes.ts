import express from 'express';
import {
  getVehicleTypes,
  getActiveVehicleTypes,
  getVehicleTypeById,
  createVehicleType,
  updateVehicleType,
  updateVehiclePricing,
  deleteVehicleType,
  toggleVehicleType,
  calculateRideFare,
} from '../controllers/vehicleType.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/active', getActiveVehicleTypes);
router.post('/calculate-fare', calculateRideFare);

// Protected routes (admin only)
router.use(protect);
router.get('/', getVehicleTypes);
router.get('/:id', getVehicleTypeById);
router.post('/', restrictTo('admin'), createVehicleType);
router.put('/:id', restrictTo('admin'), updateVehicleType);
router.patch('/:id/pricing', restrictTo('admin'), updateVehiclePricing);
router.delete('/:id', restrictTo('admin'), deleteVehicleType);
router.patch('/:id/toggle', restrictTo('admin'), toggleVehicleType);

export default router;

