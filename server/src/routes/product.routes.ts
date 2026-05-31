import { Router } from 'express';
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

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected routes (customers)
router.post('/:id/reviews', requireAuth, addProductReview);

// Admin routes
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct);

export default router;
