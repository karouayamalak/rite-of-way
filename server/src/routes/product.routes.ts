import { Router, Request, Response, NextFunction } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductReviews,
  addProductReview,
} from '../controllers/product.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

// Sets HTTP Cache-Control header so CDNs and browsers cache the response.
const httpCache = (maxAge: number) => (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 5}`);
  next();
};

const router = Router();

// Public routes — cached at CDN/browser level for 60s
router.get('/', httpCache(60), cacheMiddleware(60), getProducts);
router.get('/categories', httpCache(120), cacheMiddleware(120), getCategories);
router.get('/slug/:slug', httpCache(60), cacheMiddleware(60), getProductBySlug);
router.get('/:id', httpCache(60), cacheMiddleware(60), getProductById);
router.get('/:id/reviews', httpCache(30), getProductReviews);

// Protected routes (customers)
router.post('/:id/reviews', requireAuth, addProductReview);

// Admin routes
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
