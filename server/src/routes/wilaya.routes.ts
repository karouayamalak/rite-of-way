import { Router } from 'express';
import {
  getWilayas,
  getWilayasAdmin,
  createWilaya,
  updateWilaya,
  bulkUpdateWilayas,
} from '../controllers/wilaya.controller';
import { requireAdmin } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Public — cached 5 minutes
router.get('/', cacheMiddleware(300), getWilayas);

// Admin
router.get('/admin/all', requireAdmin, getWilayasAdmin);
router.post('/', requireAdmin, createWilaya);
router.put('/bulk', requireAdmin, bulkUpdateWilayas);
router.put('/:id', requireAdmin, updateWilaya);

export default router;
