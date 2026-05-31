import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { createError } from '../middleware/errorHandler';
import { sendOrderConfirmationEmail } from '../lib/email';

// ─── Create Order ──────────────────────────────────────────────────────────
export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, shipping, couponCode, guestEmail } = req.body;

    if (!items || items.length === 0) {
      return next(createError('Order must have at least one item', 400));
    }

    if (!shipping?.firstName || !shipping?.phone || !shipping?.wilaya) {
      return next(createError('Shipping information is incomplete', 400));
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = shipping.shippingCost || 0;

    // Apply coupon
    let discount = 0;
    let validCoupon: typeof Coupon.prototype | null = null;

    if (couponCode) {
      validCoupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
      });

      if (validCoupon && subtotal >= validCoupon.minOrderAmount) {
        if (validCoupon.type === 'percent') {
          discount = Math.round((subtotal * validCoupon.value) / 100);
        } else {
          discount = Math.min(validCoupon.value, subtotal);
        }
        validCoupon.usedCount += 1;
        if (validCoupon.usedCount >= validCoupon.maxUses) {
          validCoupon.isActive = false;
        }
        await validCoupon.save();
      }
    }

    const total = subtotal + shippingCost - discount;

    const order = await Order.create({
      customer: req.user?.userId || undefined,
      guestEmail: req.user ? undefined : guestEmail,
      items,
      shipping,
      subtotal,
      shippingCost,
      discount,
      couponCode: validCoupon ? couponCode.toUpperCase() : undefined,
      total,
      payment: { method: 'cod', status: 'pending' },
      status: 'pending',
    });

    // Send confirmation email (non-blocking)
    const emailAddress = req.user?.email || guestEmail;
    const customerName = shipping.firstName;
    if (emailAddress) {
      sendOrderConfirmationEmail(emailAddress, customerName, order.orderNumber, total).catch(console.error);
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      },
      message: 'Order placed successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Orders (Customer) ──────────────────────────────────────────────
export const getMyOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find({ customer: req.user!.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Order ──────────────────────────────────────────────────────
export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .lean();

    if (!order) return next(createError('Order not found', 404));

    // Customers can only see their own orders
    if (req.user?.role !== 'admin' && order.customer) {
      const customerObj = order.customer as any;
      const customerId = customerObj._id
        ? customerObj._id.toString()
        : customerObj.toString();

      if (customerId !== req.user?.userId) {
        return next(createError('Access denied', 403));
      }
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Orders (Admin) ────────────────────────────────────────────────
export const getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) query.orderNumber = { $regex: search as string, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Order Status (Admin) ───────────────────────────────────────────
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, note, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(createError('Order not found', 404));

    if (status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return next(createError('Invalid status', 400));
      }
      order.status = status;
      order.statusHistory.push({ status, note, updatedAt: new Date() });
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'unpaid', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return next(createError('Invalid payment status', 400));
      }
      order.payment.status = paymentStatus;
    }

    await order.save();

    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Order ──────────────────────────────────────────────────────────
export const cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError('Order not found', 404));

    // Customers can only cancel their own pending orders
    if (req.user?.role !== 'admin') {
      if (order.customer?.toString() !== req.user?.userId) {
        return next(createError('Access denied', 403));
      }
      if (!['pending', 'confirmed'].includes(order.status)) {
        return next(createError('Cannot cancel an order that is already being processed', 400));
      }
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by customer', updatedAt: new Date() });
    await order.save();

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    next(error);
  }
};
