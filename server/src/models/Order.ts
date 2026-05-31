import mongoose, { Document, Schema, Types } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'stripe';

export interface IOrderItem {
  product: Types.ObjectId;
  title: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

export interface IShippingInfo {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  wilaya: string;
  shippingCost: number;
  deliveryType?: 'home' | 'stopdesk';
}

export interface IOrder extends Document {
  orderNumber: string;
  customer?: Types.ObjectId;
  guestEmail?: string;
  items: IOrderItem[];
  shipping: IShippingInfo;
  subtotal: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  total: number;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    stripePaymentIntentId?: string;
  };
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    note?: string;
    updatedAt: Date;
  }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String },
  color: { type: String },
});

const ShippingInfoSchema = new Schema<IShippingInfo>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  wilaya: { type: String, required: true },
  shippingCost: { type: Number, required: true, default: 0 },
  deliveryType: { type: String, enum: ['home', 'stopdesk'], default: 'home' },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String },
    items: [OrderItemSchema],
    shipping: { type: ShippingInfoSchema, required: true },
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true },
    payment: {
      method: {
        type: String,
        enum: ['cod', 'stripe'],
        default: 'cod',
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      stripePaymentIntentId: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String },
  },
  { timestamps: true }
);

// ─── Auto-generate order number ────────────────────────────────────────────
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.orderNumber = `ROW-${year}${month}-${random}`;

    // Initialize status history
    this.statusHistory = [{ status: this.status, updatedAt: new Date() }];
  }
  next();
});

// ─── Indexes ───────────────────────────────────────────────────────────────
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
