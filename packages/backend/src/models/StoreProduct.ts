import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreProduct extends Document {
  storeId: string;
  variantId: string;
  creatorId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  price: string;
  currency: string;
  inventory?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const StoreProductSchema = new Schema<IStoreProduct>(
  {
    storeId: {
      type: String,
      required: true,
      ref: 'Store',
    },
    variantId: {
      type: String,
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'Creator',
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    price: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    inventory: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on storeId and variantId
StoreProductSchema.index({ storeId: 1, variantId: 1 }, { unique: true });
StoreProductSchema.index({ storeId: 1 });
StoreProductSchema.index({ variantId: 1 });
StoreProductSchema.index({ creatorId: 1 });

export const StoreProduct = mongoose.model<IStoreProduct>('StoreProduct', StoreProductSchema);
