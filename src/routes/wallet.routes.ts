import { Router } from 'express';
import { body } from 'express-validator';
import {
  getWallet,
  getWalletBalance,
  topUpWallet,
  confirmTopUp,
  getTransactionHistory,
  getWalletStats,
  withdrawFromWallet,
  getAllWallets,
  getAdminWalletStats,
} from '../controllers/wallet.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';

const router = Router();

router.use(protect);

// Validation
const topUpValidation = [
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Minimum top-up amount is ₹100'),
];

const withdrawValidation = [
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Minimum withdrawal amount is ₹100'),
  body('bankAccountId').optional().isString(),
  body('bankAccount').optional().isObject(),
];

// User routes
router.get('/', getWallet);
router.get('/balance', getWalletBalance);
router.post('/top-up', validate(topUpValidation), topUpWallet);
// Mobile alias
router.post('/add-money', validate(topUpValidation), topUpWallet);
router.post('/confirm-top-up', confirmTopUp);
router.get('/transactions', getTransactionHistory);
router.get('/stats', getWalletStats);
router.post('/withdraw', validate(withdrawValidation), withdrawFromWallet);

// Admin routes
router.get('/all', restrictTo('admin'), getAllWallets);
router.get('/admin/stats', restrictTo('admin'), getAdminWalletStats);

export default router;

