import { Router } from 'express';
import { getStoreSettings, updateStoreSettings } from '../controllers/settings.controller';
import { requireAdmin } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Public route to fetch settings (cached for 10 minutes)
router.get('/', cacheMiddleware(600), getStoreSettings);

// Admin route to update settings
router.put('/', requireAdmin, updateStoreSettings);

export default router;
