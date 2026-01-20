import { Request, Response } from 'express';
import User from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import { getFirebaseAuth } from '../config/firebase';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
// Legacy SMS-OTP was replaced by Firebase Phone OTP (Flutter).

async function handleFirebaseExchange(
  input: { idToken: string; role?: string },
  res: Response
) {
  const { idToken, role } = input;
  if (!idToken) throw new AppError('Firebase idToken is required', 400);

  const decoded = await getFirebaseAuth().verifyIdToken(idToken);

  const firebaseUid = decoded.uid;
  const email = decoded.email;
  const phoneE164 = (decoded as any).phone_number as string | undefined;
  const name = (decoded as any).name as string | undefined;
  const emailVerified = Boolean((decoded as any).email_verified);
  const phoneDigits = phoneE164 ? phoneE164.replace(/\D/g, '') : undefined;

  // Normalize common formats:
  // - +91XXXXXXXXXX => store XXXXXXXXXX
  // - +<cc><number> => store digits only (no '+')
  const normalizedPhone =
    phoneDigits && phoneDigits.length === 12 && phoneDigits.startsWith('91')
      ? phoneDigits.slice(2)
      : phoneDigits;

  // Allow only safe roles from request body (never allow admin)
  const requestedRole =
    role && ['user', 'driver'].includes(role) ? (role as 'user' | 'driver') : undefined;

  const orFilters: any[] = [{ firebaseUid }];
  if (email) orFilters.push({ email });
  if (normalizedPhone) orFilters.push({ phone: normalizedPhone });

  let user = await User.findOne({ $or: orFilters });

  if (!user) {
    const [firstNameRaw, ...rest] = (name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = firstNameRaw || 'User';
    const lastName = rest.join(' ') || 'Firebase';

    user = await User.create({
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      role: requestedRole || 'user',
      authProvider: 'firebase',
      firebaseUid,
      isEmailVerified: emailVerified || false,
      isPhoneVerified: Boolean(normalizedPhone),
      lastLogin: new Date(),
    });
  } else {
    // Link Firebase UID if not linked yet
    if (!user.firebaseUid) user.firebaseUid = firebaseUid;
    // If the user is logging in via Firebase, mark provider as firebase
    if (user.authProvider !== 'firebase') user.authProvider = 'firebase';

    // Prevent role swapping via request body
    if (requestedRole && user.role !== requestedRole) {
      throw new AppError('Role mismatch for this account', 400);
    }

    // Backfill optional fields if missing
    if (!user.email && email) user.email = email;
    if (!user.phone && normalizedPhone) user.phone = normalizedPhone;
    if (!user.isEmailVerified && emailVerified) user.isEmailVerified = true;
    if (!user.isPhoneVerified && normalizedPhone) user.isPhoneVerified = true;

    user.lastLogin = new Date();
    await user.save();
  }

  if (user.role === 'admin') {
    throw new AppError('Admin login is not allowed via Firebase OTP', 400);
  }

  if (user.status !== 'active') {
    throw new AppError('Your account is not active', 403);
  }

  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  user.refreshToken = tokens.refreshToken;
  await user.save();

  return res.status(200).json({
    status: 'success',
    message: 'Firebase login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      tokens,
    },
  });
}

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw new AppError('User already exists with this email or phone', 400);
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: role || 'user',
    authProvider: 'local',
  });

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Save refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      tokens,
    },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, idToken, role } = req.body as {
    email?: string;
    password?: string;
    idToken?: string;
    role?: string;
  };

  // OTP-first: allow Firebase token exchange through /auth/login too (for client compatibility)
  if (idToken) {
    return handleFirebaseExchange({ idToken, role }, res);
  }

  // Check if email and password exist
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Get user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.authProvider === 'firebase') {
    throw new AppError('This account uses Firebase login. Please sign in with Firebase.', 400);
  }

  // OTP-only for users & drivers: keep password login for admin dashboard only
  if (user.role !== 'admin') {
    throw new AppError('Please login with OTP using Firebase', 400);
  }

  if (!(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Your account is not active', 403);
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Save refresh token and update last login
  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      tokens,
    },
  });
});

// @desc    Signup (legacy alias for register)
// @route   POST /api/v1/auth/signup
// @access  Public
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, role, referralCode } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    referralCode?: string;
  };

  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'User';
  const lastName = parts.slice(1).join(' ') || 'App';

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email?.toLowerCase() }, { phone }],
  });

  if (existingUser) {
    throw new AppError('User already exists with this email or phone', 400);
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email?.toLowerCase(),
    phone,
    password,
    role: role || 'user',
    authProvider: 'local',
  });

  const tokens = generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  user.refreshToken = tokens.refreshToken;
  await user.save();

  // NOTE: referralCode support can be implemented by calling referral logic here if needed.
  void referralCode;

  return res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      tokens,
    },
  });
});

// @desc    Request OTP for user login
// @route   POST /api/v1/auth/request-otp
// @access  Public
export const requestOtp = asyncHandler(async (_req: Request, res: Response) => {
  // Deprecated: we now use Firebase Phone OTP in the client (Flutter),
  // then exchange Firebase idToken via /auth/firebase.
  res.status(410).json({
    status: 'fail',
    message: 'Deprecated. Use Firebase Phone OTP on client and call POST /auth/firebase with idToken.',
  });
});

// @desc    Verify OTP and login user
// @route   POST /api/v1/auth/verify-otp
// @access  Public
export const verifyOtp = asyncHandler(async (_req: Request, res: Response) => {
  // Accept Firebase token exchange for clients that still call /auth/verify-otp
  const { idToken, role } = (_req.body || {}) as { idToken?: string; role?: string };
  if (idToken) {
    return handleFirebaseExchange({ idToken, role }, res);
  }

  return res.status(410).json({
    status: 'fail',
    message: 'Deprecated. Use Firebase Phone OTP on client and call POST /auth/firebase with idToken.',
  });
});

// @desc    Firebase login (exchange Firebase ID token for backend JWTs)
// @route   POST /api/v1/auth/firebase
// @access  Public
export const firebaseLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role } = req.body as { idToken?: string; role?: string };
  return handleFirebaseExchange({ idToken: idToken || '', role }, res);
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check refresh token
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  }
);

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Clear refresh token
  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: undefined,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logout successful',
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/update-password
// @access  Private
export const updatePassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  }
);

// @desc    Update my profile (legacy /auth/profile used by some apps)
// @route   PUT /api/v1/auth/profile
// @access  Private
export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, firstName, lastName, email, phone } = req.body as {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };

  const update: any = {};

  if (typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    update.firstName = parts[0] || undefined;
    update.lastName = parts.slice(1).join(' ') || undefined;
  }
  if (typeof firstName === 'string' && firstName.trim()) update.firstName = firstName.trim();
  if (typeof lastName === 'string' && lastName.trim()) update.lastName = lastName.trim();
  if (typeof email === 'string' && email.trim()) update.email = email.trim().toLowerCase();
  if (typeof phone === 'string' && phone.trim()) update.phone = phone.trim();

  const user = await User.findByIdAndUpdate(req.user._id, update, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { user },
  });
});

// @desc    Forgot password (returns reset token for now)
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) throw new AppError('Email is required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new AppError('User not found', 404);

  if (user.authProvider === 'firebase') {
    throw new AppError('This account uses Firebase login. Password reset is not available.', 400);
  }

  // Short-lived reset token (JWT)
  const resetToken = jwt.sign(
    { userId: user._id.toString(), purpose: 'password_reset' },
    config.jwtSecret,
    { expiresIn: '15m' }
  );

  // NOTE: In production, email/SMS this token or a reset link.
  res.status(200).json({
    status: 'success',
    message: 'Password reset token generated',
    data: { resetToken },
  });
});

// @desc    Reset password using reset token
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) throw new AppError('token and newPassword are required', 400);

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired reset token', 400);
  }

  if (!decoded || decoded.purpose !== 'password_reset' || !decoded.userId) {
    throw new AppError('Invalid reset token', 400);
  }

  const user = await User.findById(decoded.userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  if (user.authProvider === 'firebase') {
    throw new AppError('This account uses Firebase login. Password reset is not available.', 400);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
  });
});

