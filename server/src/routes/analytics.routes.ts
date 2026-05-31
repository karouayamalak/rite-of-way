import { Router } from 'express';
import { getDashboardStats, getRevenueChart, getTopProducts, getOrdersByStatus } from '../controllers/analytics.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/dashboard', requireAdmin, getDashboardStats);
router.get('/revenue-chart', requireAdmin, getRevenueChart);
router.get('/top-products', requireAdmin, getTopProducts);
router.get('/orders-by-status', requireAdmin, getOrdersByStatus);

export default router;
