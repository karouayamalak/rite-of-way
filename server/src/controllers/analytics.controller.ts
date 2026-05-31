import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';

// ─── Dashboard Stats ───────────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalOrders,
      todayOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      recentOrders,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments({ status: 'pending' }),
      Order.find()
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const currentMonthRevenue = monthRevenue[0]?.total || 0;
    const previousMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = previousMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: currentMonthRevenue,
        revenueGrowth,
        totalOrders,
        todayOrders,
        totalProducts,
        totalCustomers,
        pendingOrders,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Revenue Chart (last 30 days) ─────────────────────────────────────────
export const getRevenueChart = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const chartData = revenueData.map((d) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
      revenue: d.revenue,
      orders: d.orders,
    }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};

// ─── Top Products ──────────────────────────────────────────────────────────
export const getTopProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.title',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    next(error);
  }
};

// ─── Orders by Status ──────────────────────────────────────────────────────
export const getOrdersByStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const statusData = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: statusData });
  } catch (error) {
    next(error);
  }
};
