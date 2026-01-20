import { Router } from 'express';
import {
  uploadSingle,
  uploadMultiple,
  uploadDriverDocuments,
  uploadProfilePicture,
  uploadVehicleImages,
  deleteFile,
} from '../controllers/upload.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { upload } from '../services/upload.service';

const router = Router();

router.use(protect);

// Single file upload
router.post('/single', upload.single('file'), uploadSingle);

// Multiple files upload
router.post('/multiple', upload.array('files', 10), uploadMultiple);

// Profile picture
router.post('/profile-picture', upload.single('profilePicture'), uploadProfilePicture);
// Mobile alias: field name is "profile"
router.post('/profile', upload.single('profile'), uploadProfilePicture);

// Driver documents
router.post(
  '/driver-documents',
  restrictTo('driver'),
  upload.fields([
    { name: 'license', maxCount: 1 },
    { name: 'vehicleRC', maxCount: 1 },
    { name: 'insurance', maxCount: 1 },
    { name: 'pollutionCertificate', maxCount: 1 },
  ]),
  uploadDriverDocuments
);

// Vehicle images
router.post(
  '/vehicle-images',
  restrictTo('driver'),
  upload.array('images', 5),
  uploadVehicleImages
);

// Delete file
router.delete('/:filename', deleteFile);

export default router;

