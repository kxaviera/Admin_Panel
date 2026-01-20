import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { UploadService } from '../services/upload.service';
import Driver from '../models/Driver.model';
import User from '../models/User.model';

// @desc    Upload single file
// @route   POST /api/v1/upload/single
// @access  Private
export const uploadSingle = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const fileUrl = UploadService.getFileUrl(
      `${req.body.folder || 'general'}/${req.file.filename}`
    );

    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        path: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  }
);

// @desc    Upload multiple files
// @route   POST /api/v1/upload/multiple
// @access  Private
export const uploadMultiple = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const files = (req.files as Express.Multer.File[]).map((file) => ({
      filename: file.filename,
      path: UploadService.getFileUrl(
        `${req.body.folder || 'general'}/${file.filename}`
      ),
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.status(200).json({
      status: 'success',
      message: 'Files uploaded successfully',
      data: { files },
    });
  }
);

// @desc    Upload driver documents
// @route   POST /api/v1/upload/driver-documents
// @access  Private/Driver
export const uploadDriverDocuments = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.files) {
      throw new AppError('No files uploaded', 400);
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    // Update driver documents
    if (files.license && files.license[0]) {
      driver.documents.license = UploadService.getFileUrl(
        `documents/${files.license[0].filename}`
      );
    }

    if (files.vehicleRC && files.vehicleRC[0]) {
      driver.documents.vehicleRC = UploadService.getFileUrl(
        `documents/${files.vehicleRC[0].filename}`
      );
    }

    if (files.insurance && files.insurance[0]) {
      driver.documents.insurance = UploadService.getFileUrl(
        `documents/${files.insurance[0].filename}`
      );
    }

    if (files.pollutionCertificate && files.pollutionCertificate[0]) {
      driver.documents.pollutionCertificate = UploadService.getFileUrl(
        `documents/${files.pollutionCertificate[0].filename}`
      );
    }

    await driver.save();

    res.status(200).json({
      status: 'success',
      message: 'Driver documents uploaded successfully',
      data: { documents: driver.documents },
    });
  }
);

// @desc    Upload profile picture
// @route   POST /api/v1/upload/profile-picture
// @access  Private
export const uploadProfilePicture = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate it's an image
    if (!UploadService.isImage(req.file.filename)) {
      throw new AppError('File must be an image', 400);
    }

    const profilePicUrl = UploadService.getFileUrl(
      `profiles/${req.file.filename}`
    );

    // Update user profile picture
    await User.findByIdAndUpdate(req.user._id, {
      profilePicture: profilePicUrl,
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: { profilePicture: profilePicUrl },
    });
  }
);

// @desc    Upload vehicle images
// @route   POST /api/v1/upload/vehicle-images
// @access  Private/Driver
export const uploadVehicleImages = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const driver = await Driver.findOne({ userId: req.user._id });

    if (!driver) {
      throw new AppError('Driver profile not found', 404);
    }

    const images = (req.files as Express.Multer.File[]).map((file) =>
      UploadService.getFileUrl(`vehicles/${file.filename}`)
    );

    driver.vehicleImages = [...(driver.vehicleImages || []), ...images];
    await driver.save();

    res.status(200).json({
      status: 'success',
      message: 'Vehicle images uploaded successfully',
      data: { images },
    });
  }
);

// @desc    Delete file
// @route   DELETE /api/v1/upload/:filename
// @access  Private
export const deleteFile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { filename } = req.params;
    const { folder } = req.query;

    const filePath = folder ? `${folder}/${filename}` : filename;

    UploadService.deleteFile(filePath);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully',
    });
  }
);

