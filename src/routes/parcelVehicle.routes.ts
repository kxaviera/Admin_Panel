import express from 'express';
import {
  getParcelVehicles,
  getActiveParcelVehicles,
  createParcelVehicle,
  updateParcelVehicle,
  updateParcelVehiclePricing,
  deleteParcelVehicle,
  toggleParcelVehicle,
  calculateParcelPrice,
  findSuitableVehicles,
} from '../controllers/parcelVehicle.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/active', getActiveParcelVehicles);
router.get('/find-suitable', findSuitableVehicles);
router.post('/calculate-price', calculateParcelPrice);

// Protected routes (admin only)
router.use(protect, restrictTo('admin'));
router.get('/', getParcelVehicles);
router.post('/', createParcelVehicle);
router.put('/:id', updateParcelVehicle);
router.patch('/:id/pricing', updateParcelVehiclePricing);
router.delete('/:id', deleteParcelVehicle);
router.patch('/:id/toggle', toggleParcelVehicle);

export default router;

