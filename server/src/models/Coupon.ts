import mongoose, { Document, Schema } from 'mongoose';

export type CouponType = 'percent' | 'fixed';

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    },
    type: {
      type: String,
      enum: ['percent', 'fixed'],
      required: [true, 'Coupon type is required'],
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [0, 'Value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxUses: {
      type: Number,
      default: 100,
      min: [1, 'Max uses must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
