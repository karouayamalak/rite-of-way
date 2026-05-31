import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getCustomers,
} from '../controllers/auth.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Admin only routes
router.get('/users', requireAdmin, getCustomers);

export default router;
