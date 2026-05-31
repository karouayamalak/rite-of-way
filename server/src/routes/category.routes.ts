import { Router, Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
});

// Admin CRUD
router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
});

router.put('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
});

export default router;
