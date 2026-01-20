import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.body.folder || 'general';
    const dest = path.join(uploadDir, folder);
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Only images and documents are allowed', 400));
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

/**
 * Upload service class for advanced operations
 */
export class UploadService {
  /**
   * Delete file from filesystem
   */
  static deleteFile(filePath: string): void {
    try {
      const fullPath = path.join(uploadDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`File deleted: ${filePath}`);
      }
    } catch (error: any) {
      logger.error(`Error deleting file: ${error.message}`);
    }
  }

  /**
   * Get file URL
   */
  static getFileUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
    return size <= maxSize;
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Check if file is image
   */
  static isImage(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  }

  /**
   * Check if file is document
   */
  static isDocument(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['.pdf', '.doc', '.docx'].includes(ext);
  }
}

