import { Router } from 'express';
import { getActivityLogs } from '../controllers/activity.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Admin-only route to fetch audit activity logs
router.get('/', requireAdmin, getActivityLogs);

export default router;
