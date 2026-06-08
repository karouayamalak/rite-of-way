import { Router, Request, Response, NextFunction } from 'express';
import {
  getWilayas,
  getWilayasAdmin,
  createWilaya,
  updateWilaya,
  bulkUpdateWilayas,
} from '../controllers/wilaya.controller';
import { requireAdmin } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const httpCache = (maxAge: number) => (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 5}`);
  next();
};

const router = Router();

// Public — cached 5 minutes (wilaya rates rarely change)
router.get('/', httpCache(300), cacheMiddleware(300), getWilayas);

// Admin
router.get('/admin/all', requireAdmin, getWilayasAdmin);
router.post('/', requireAdmin, createWilaya);
router.put('/bulk', requireAdmin, bulkUpdateWilayas);
router.put('/:id', requireAdmin, updateWilaya);

export default router;
