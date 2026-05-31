import { Router, Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/Coupon';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ─── Validate Coupon (Public) ──────────────────────────────────────────────
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: 'Coupon code is required' });
      return;
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
    });

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
      return;
    }

    if (coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
      return;
    }

    if (orderAmount && orderAmount < coupon.minOrderAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ${coupon.minOrderAmount.toLocaleString('fr-DZ')} DA`,
      });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percent') {
      discount = Math.round((orderAmount * coupon.value) / 100);
    } else {
      discount = Math.min(coupon.value, orderAmount);
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        message: coupon.type === 'percent'
          ? `${coupon.value}% discount applied`
          : `${coupon.value.toLocaleString('fr-DZ')} DA discount applied`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── Admin CRUD ────────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) { res.status(404).json({ success: false, message: 'Coupon not found' }); return; }
    res.json({ success: true, data: coupon, message: 'Coupon updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
