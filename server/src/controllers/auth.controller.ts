import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { signToken } from '../lib/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';
import { createError } from '../middleware/errorHandler';

// ─── Register ──────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(createError('Please provide name, email, and password', 400));
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(createError('An account with this email already exists', 400));
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email (non-blocking)
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account created! Please verify your email.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(createError('Invalid email or password', 401));
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return next(createError('Invalid email or password', 401));
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Current User ──────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) {
      return next(createError('User not found', 404));
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ────────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, addresses } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { ...(name && { name }), ...(addresses && { addresses }) },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ──────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return next(createError('Invalid or expired verification token', 400));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ───────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(createError('Failed to send reset email. Please try again.', 500));
    }

    res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return next(createError('Password must be at least 8 characters', 400));
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return next(createError('Invalid or expired reset token', 400));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = signToken({ userId: user._id.toString(), role: user.role });

    res.json({
      success: true,
      message: 'Password reset successfully!',
      token: jwtToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ───────────────────────────────────────────────────────
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!.userId).select('+password');
    if (!user) return next(createError('User not found', 404));

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return next(createError('Current password is incorrect', 401));

    if (newPassword.length < 8) {
      return next(createError('New password must be at least 8 characters', 400));
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Customers (Admin Only) ────────────────────────────────────────
export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customers = await User.aggregate([
      { $match: { role: 'customer' } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'customer',
          as: 'orders',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          isVerified: 1,
          createdAt: 1,
          orderCount: { $size: '$orders' },
          totalSpent: { $sum: '$orders.total' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};
