import mongoose, { Document, Schema } from 'mongoose';
import slugify from 'slugify';

export interface IProductImage {
  url: string;
  publicId: string;
  alt?: string;
}

export interface ISizeStock {
  size: string;
  stock: number;
}

export interface IColorVariant {
  color: string;
  sizes: ISizeStock[];
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  brand?: string;
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
  images: IProductImage[];
  variants?: IColorVariant[];
  badge?: string;
  isFeatured: boolean;
  isTrending: boolean;
  isNew: boolean;
  ratings: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  alt: { type: String, default: '' },
});

const SizeStockSchema = new Schema<ISizeStock>({
  size: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
}, { _id: false });

const ColorVariantSchema = new Schema<IColorVariant>({
  color: { type: String, required: true, trim: true },
  sizes: [SizeStockSchema],
}, { _id: false });

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (this: IProduct, val: number) {
          return val < this.price;
        },
        message: 'Discount price must be less than regular price',
      },
    },
    brand: { type: String, trim: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    sizes: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: [ProductImageSchema],
    variants: [ColorVariantSchema],
    badge: { type: String, trim: true },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  } as any,
  { timestamps: true }
);

// ─── Auto-generate slug from title and calculate variants stock ───────────
ProductSchema.pre('save', async function (this: IProduct, next) {
  if (this.isModified('title')) {
    let slug = slugify(this.title, { lower: true, strict: true });
    // Ensure uniqueness
    const existing = await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }
    this.slug = slug;
  }

  // Automatically calculate stock, colors, and sizes fields from variants
  if (this.variants && this.variants.length > 0) {
    this.colors = this.variants.map((v: any) => v.color);
    
    const sizesSet = new Set<string>();
    let totalStock = 0;
    this.variants.forEach((v: any) => {
      v.sizes.forEach((s: any) => {
        sizesSet.add(s.size);
        totalStock += s.stock;
      });
    });
    this.sizes = Array.from(sizesSet);
    this.stock = totalStock;
  }

  next();
});

// ─── Indexes ───────────────────────────────────────────────────────────────
ProductSchema.index({ category: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isTrending: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ title: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
