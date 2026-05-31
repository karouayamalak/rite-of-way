import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controller';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// Create order (works for both guests and logged-in users)
router.post('/', optionalAuth, createOrder);

// Customer routes
router.get('/my-orders', requireAuth, getMyOrders);
router.get('/:id', requireAuth, getOrderById);
router.post('/:id/cancel', requireAuth, cancelOrder);

// Admin routes
router.get('/', requireAdmin, getAllOrders);
router.put('/:id/status', requireAdmin, updateOrderStatus);

export default router;
