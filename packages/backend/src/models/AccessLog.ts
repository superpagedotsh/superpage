import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessLog extends Document {
  resourceId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  walletAddress?: string;
  paymentSignature: string;
  amountUsdc: number;
  network: string;
  ipAddress?: string;
  userAgent?: string;
  accessedAt: Date;
}

const AccessLogSchema = new Schema<IAccessLog>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Resource',
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Creator',
    },
    walletAddress: {
      type: String,
    },
    paymentSignature: {
      type: String,
      required: true,
      unique: true,
    },
    amountUsdc: {
      type: Number,
      required: true,
      min: 0,
    },
    network: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    accessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use accessedAt instead
  }
);

// Indexes
// paymentSignature is already indexed via unique: true
AccessLogSchema.index({ resourceId: 1, walletAddress: 1 });
AccessLogSchema.index({ resourceId: 1, accessedAt: -1 });
AccessLogSchema.index({ creatorId: 1, accessedAt: -1 });
AccessLogSchema.index({ walletAddress: 1 });
AccessLogSchema.index({ accessedAt: -1 });

export const AccessLog = mongoose.model<IAccessLog>('AccessLog', AccessLogSchema);
