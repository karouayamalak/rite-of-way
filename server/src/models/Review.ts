import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  product: Types.ObjectId;
  user: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    userName: { type: String, required: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── One review per user per product ──────────────────────────────────────
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// ─── Update product ratings after review save ──────────────────────────────
ReviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      'ratings.average': Math.round(stats[0].avgRating * 10) / 10,
      'ratings.count': stats[0].count,
    });
  }
});

// ─── Update product ratings after review delete ────────────────────────────
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Product = mongoose.model('Product');
    const stats = await mongoose.model('Review').aggregate([
      { $match: { product: doc.product } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(doc.product, {
        'ratings.average': Math.round(stats[0].avgRating * 10) / 10,
        'ratings.count': stats[0].count,
      });
    } else {
      await Product.findByIdAndUpdate(doc.product, { 'ratings.average': 0, 'ratings.count': 0 });
    }
  }
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
