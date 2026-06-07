import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Coupon } from '../models/Coupon';
import { Product } from '../models/Product';
import { createError } from '../middleware/errorHandler';
import { sendOrderConfirmationEmail } from '../lib/email';
import { localCache } from '../lib/cache';
import { logAdminActivity } from '../lib/activity';

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

    // Validate stock and prepare update operations
    const deductions: {
      productId: string;
      color?: string;
      size?: string;
      quantity: number;
      title: string;
    }[] = [];

    for (const item of items) {
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return next(createError(`Product "${item.title}" no longer exists`, 404));
      }

      // Check if product has variants
      if (dbProduct.variants && dbProduct.variants.length > 0) {
        // Resolve color if missing
        let resolvedColor = item.color;
        if (!resolvedColor && dbProduct.variants.length === 1) {
          resolvedColor = dbProduct.variants[0].color;
        }

        // Color is required if there are multiple colors and it wasn't resolved/provided
        if (!resolvedColor && dbProduct.variants.length > 1) {
          return next(createError(`Color must be selected for "${item.title}"`, 400));
        }

        // Find the variant
        const variant = dbProduct.variants.find(
          (v) => v.color.toLowerCase() === (resolvedColor || '').toLowerCase()
        );
        if (!variant) {
          return next(createError(`Color "${resolvedColor || item.color}" is not available for "${item.title}"`, 400));
        }

        // Resolve size if missing
        let resolvedSize = item.size;
        if (!resolvedSize && variant.sizes.length === 1) {
          resolvedSize = variant.sizes[0].size;
        }

        // Size is required if there are multiple sizes and it wasn't resolved/provided
        const hasMultipleSizes = variant.sizes.length > 1 && !variant.sizes.every(s => s.size === 'One Size');
        if (!resolvedSize && hasMultipleSizes) {
          return next(createError(`Size must be selected for "${item.title}"`, 400));
        }

        // Check stock based on sizes
        if (variant.sizes.length > 0) {
          const sizeObj = variant.sizes.find(
            (s) => s.size.toLowerCase() === (resolvedSize || '').toLowerCase()
          );
          if (!sizeObj || sizeObj.stock < item.quantity) {
            return next(
              createError(
                `Insufficient stock for "${item.title}" (${variant.color}${sizeObj ? ' - ' + sizeObj.size : ''}). Available: ${
                  sizeObj ? sizeObj.stock : 0
                }`,
                400
              )
            );
          }
          item.size = sizeObj.size;
        } else {
          // If no sizes exist in this variant, fall back to global product stock
          if (dbProduct.stock < item.quantity) {
            return next(
              createError(
                `Insufficient stock for "${item.title}". Available: ${dbProduct.stock}`,
                400
              )
            );
          }
        }

        item.color = variant.color;
      } else {
        // Simple stock check
        if (dbProduct.stock < item.quantity) {
          return next(
            createError(
              `Insufficient stock for "${item.title}". Available: ${dbProduct.stock}`,
              400
            )
          );
        }
      }

      deductions.push({
        productId: item.product,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        title: item.title,
      });
    }

    // Perform atomic deductions
    const completedDeductions: typeof deductions = [];
    try {
      for (const d of deductions) {
        let updatedProduct;
        if (d.color && d.size) {
          // Atomic update for nested array variants
          updatedProduct = await Product.findOneAndUpdate(
            {
              _id: d.productId,
              'variants.color': d.color,
              'variants.sizes.size': d.size,
              'variants.sizes.stock': { $gte: d.quantity },
            },
            {
              $inc: {
                'variants.$[outer].sizes.$[inner].stock': -d.quantity,
              },
            },
            {
              arrayFilters: [
                { 'outer.color': d.color },
                { 'inner.size': d.size },
              ],
              new: true,
            }
          );
        } else {
          // Atomic update for standard stock
          updatedProduct = await Product.findOneAndUpdate(
            {
              _id: d.productId,
              stock: { $gte: d.quantity },
            },
            {
              $inc: { stock: -d.quantity },
            },
            { new: true }
          );
        }

        if (!updatedProduct) {
          throw new Error(`Stock deduction failed for product ID ${d.productId} due to concurrent updates`);
        }

        // Trigger pre-save hooks to recalculate stock totals
        await updatedProduct.save();
        completedDeductions.push(d);
      }
    } catch (err: any) {
      // Rollback successful deductions to ensure transactional integrity
      for (const cd of completedDeductions) {
        if (cd.color && cd.size) {
          const p = await Product.findOneAndUpdate(
            {
              _id: cd.productId,
              'variants.color': cd.color,
              'variants.sizes.size': cd.size,
            },
            {
              $inc: {
                'variants.$[outer].sizes.$[inner].stock': cd.quantity,
              },
            },
            {
              arrayFilters: [
                { 'outer.color': cd.color },
                { 'inner.size': cd.size },
              ],
              new: true,
            }
          );
          if (p) await p.save();
        } else {
          const p = await Product.findByIdAndUpdate(
            cd.productId,
            { $inc: { stock: cd.quantity } },
            { new: true }
          );
          if (p) await p.save();
        }
      }
      return next(
        createError(
          err.message || 'Checkout failed due to concurrent inventory updates. Please try again.',
          409
        )
      );
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

    // Invalidate cached product catalogs due to stock level changes
    localCache.deletePattern(/^cache:\/api\/products/);

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

    const oldStatus = order.status;
    const oldPaymentStatus = order.payment.status;

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

    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'ORDER_STATUS_UPDATE',
      `Updated order #${order.orderNumber} status: "${oldStatus}" -> "${order.status}" (payment: "${oldPaymentStatus}" -> "${order.payment.status}")`,
      req.ip
    );

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
