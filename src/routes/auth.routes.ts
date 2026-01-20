import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  signup,
  login,
  requestOtp,
  verifyOtp,
  firebaseLogin,
  refreshToken,
  logout,
  getMe,
  updatePassword,
  updateMyProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation';

const router = Router();

// Validation rules
const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Valid phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['user', 'driver'])
    .withMessage('Role must be user or driver'),
  body('referralCode').optional().isString(),
];

const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Valid phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['user', 'driver'])
    .withMessage('Role must be user or driver'),
  body('referralCode').optional().isString(),
];

const loginValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isString(),
  body('idToken').optional().isString(),
  body('role').optional().isIn(['user', 'driver', 'admin']),
  body().custom((_value, { req }) => {
    const b = req.body || {};
    const hasIdToken = typeof b.idToken === 'string' && b.idToken.trim().length > 0;
    const hasEmailPass =
      typeof b.email === 'string' &&
      b.email.trim().length > 0 &&
      typeof b.password === 'string' &&
      b.password.trim().length > 0;
    if (!hasIdToken && !hasEmailPass) {
      throw new Error('Provide idToken (Firebase) or email+password');
    }
    return true;
  }),
];

const requestOtpValidation = [
  body('phone')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Valid phone number is required'),
];

const verifyOtpValidation = [
  // legacy fields (deprecated)
  body('phone').optional().matches(/^[0-9]{10,15}$/),
  body('otp').optional().matches(/^[0-9]{6}$/),
  // new: firebase exchange
  body('idToken').optional().isString(),
  body('role').optional().isIn(['user', 'driver']),
  body().custom((_value, { req }) => {
    const b = req.body || {};
    const hasIdToken = typeof b.idToken === 'string' && b.idToken.trim().length > 0;
    if (hasIdToken) return true;
    // if no idToken, allow request to reach controller (which returns 410)
    return true;
  }),
];

const firebaseLoginValidation = [
  body('idToken').notEmpty().withMessage('Firebase idToken is required'),
  body('role')
    .optional()
    .isIn(['user', 'driver'])
    .withMessage('Role must be user or driver'),
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

const updateProfileValidation = [
  body('name').optional().isString(),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),
  body('email').optional().isEmail(),
  body('phone').optional().matches(/^[0-9]{10,15}$/),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

// Routes
router.post('/register', validate(registerValidation), register);
router.post('/signup', validate(signupValidation), signup);
router.post('/login', validate(loginValidation), login);
router.post('/request-otp', validate(requestOtpValidation), requestOtp);
router.post('/verify-otp', validate(verifyOtpValidation), verifyOtp);
router.post('/firebase', validate(firebaseLoginValidation), firebaseLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, validate(updatePasswordValidation), updatePassword);
router.put('/profile', protect, validate(updateProfileValidation), updateMyProfile);
router.post('/forgot-password', validate(forgotPasswordValidation), forgotPassword);
router.post('/reset-password', validate(resetPasswordValidation), resetPassword);

export default router;

