import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  id: string;
  storeId: string;
  orderIntentId?: string;
  email: string;
  items: any[];
  subtotalAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: 'confirmed' | 'fulfilled' | 'cancelled' | 'refunded';
  shopifyOrderId?: string;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    storeId: {
      type: String,
      required: true,
      ref: 'Store',
    },
    orderIntentId: {
      type: String,
      ref: 'OrderIntent',
    },
    email: {
      type: String,
      required: true,
    },
    items: {
      type: Schema.Types.Mixed,
      required: true,
    },
    subtotalAmount: {
      type: String,
      required: true,
    },
    shippingAmount: {
      type: String,
      default: '0',
    },
    taxAmount: {
      type: String,
      default: '0',
    },
    totalAmount: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['confirmed', 'fulfilled', 'cancelled', 'refunded'],
      default: 'confirmed',
    },
    shopifyOrderId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// id is already indexed via unique: true
OrderSchema.index({ storeId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ shopifyOrderId: 1 });
OrderSchema.index({ email: 1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
