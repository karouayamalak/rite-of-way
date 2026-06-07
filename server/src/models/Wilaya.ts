import mongoose, { Document, Schema } from 'mongoose';

export interface IWilaya extends Document {
  code: string;
  name: string;
  homeShippingCost: number;
  stopdeskShippingCost: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WilayaSchema = new Schema<IWilaya>(
  {
    code: {
      type: String,
      required: [true, 'Wilaya code is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Wilaya name is required'],
      trim: true,
    },
    homeShippingCost: {
      type: Number,
      required: true,
      min: [0, 'Shipping cost cannot be negative'],
      default: 600,
    },
    stopdeskShippingCost: {
      type: Number,
      required: true,
      min: [0, 'Shipping cost cannot be negative'],
      default: 400,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WilayaSchema.index({ isActive: 1 });

export const Wilaya = mongoose.model<IWilaya>('Wilaya', WilayaSchema);
