import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { Category } from '../models/Category';
import { createError } from '../middleware/errorHandler';
import { localCache } from '../lib/cache';
import { logAdminActivity } from '../lib/activity';

// ─── Get All Products (with filters, search, pagination) ──────────────────
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '12',
      category,
      search,
      minPrice,
      maxPrice,
      sort = 'createdAt',
      order = 'desc',
      isFeatured,
      isTrending,
      isNew,
      stockLessThan,
      status,       // admin can pass status filter
      showAll,      // admin flag to bypass status filter
    } = req.query;

    const query: Record<string, unknown> = {};

    // By default, only show active products (unless admin explicitly requests all)
    if (showAll !== 'true') {
      query.status = status || 'active';
    } else if (status) {
      query.status = status;
    }

    if (category && category !== 'All') query.category = category;
    if (isFeatured === 'true') query.isFeatured = true;
    if (isTrending === 'true') query.isTrending = true;
    if (isNew === 'true') query.isNew = true;

    if (stockLessThan !== undefined) {
      query.stock = { $lte: Number(stockLessThan) };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortObj: Record<string, 1 | -1> = {};

    if (sort === 'price') sortObj.price = sortDir;
    else if (sort === 'rating') sortObj['ratings.average'] = sortDir;
    else if (sort === 'name') sortObj.title = sortDir;
    else sortObj.createdAt = sortDir;

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Product by Slug ────────────────────────────────────────────
export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) return next(createError('Product not found', 404));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Product by ID ──────────────────────────────────────────────
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return next(createError('Product not found', 404));
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// ─── Create Product (Admin) ────────────────────────────────────────────────
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.create(req.body);

    // Invalidate cached product catalog
    localCache.deletePattern(/^cache:\/api\/products/);
    localCache.deletePattern(/^cache:\/api\/categories/);

    // Log admin action
    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'PRODUCT_CREATE',
      `Created product "${product.title}" (price: ${product.price} DA)`,
      req.ip
    );

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Update Product (Admin) ────────────────────────────────────────────────
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const originalProduct = await Product.findById(req.params.id);
    if (!originalProduct) return next(createError('Product not found', 404));

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return next(createError('Product not found', 404));

    // Invalidate cached product catalog
    localCache.deletePattern(/^cache:\/api\/products/);
    localCache.deletePattern(/^cache:\/api\/categories/);

    // Log admin action
    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'PRODUCT_UPDATE',
      `Updated product "${product.title}"`,
      req.ip
    );

    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Product (Admin) ────────────────────────────────────────────────
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(createError('Product not found', 404));
    
    // Invalidate cached product catalog
    localCache.deletePattern(/^cache:\/api\/products/);
    localCache.deletePattern(/^cache:\/api\/categories/);

    // Log admin action
    await logAdminActivity(
      req.user!.userId,
      req.user!.name,
      'PRODUCT_DELETE',
      `Deleted product "${product.title}"`,
      req.ip
    );

    // Also delete reviews
    await Review.deleteMany({ product: req.params.id });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Get Categories ────────────────────────────────────────────────────────
export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await Category.find({ isActive: true }).distinct('name');
    if (categories.length === 0) {
      const distinct = await Product.distinct('category');
      res.json({ success: true, data: distinct });
      return;
    }
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// ─── Get Product Reviews ───────────────────────────────────────────────────
export const getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// ─── Add Product Review ────────────────────────────────────────────────────
export const addProductReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return next(createError('Product not found', 404));

    // Check for existing review
    const existing = await Review.findOne({ product: req.params.id, user: req.user!.userId });
    if (existing) return next(createError('You have already reviewed this product', 400));

    const review = await Review.create({
      product: req.params.id,
      user: req.user!.userId,
      userName: req.user!.name,
      rating: Number(rating),
      comment,
    });

    // Invalidate cached product catalog so product detail pages and lists get fresh scores
    localCache.deletePattern(/^cache:\/api\/products/);

    res.status(201).json({ success: true, data: review, message: 'Review added successfully' });
  } catch (error) {
    next(error);
  }
};
