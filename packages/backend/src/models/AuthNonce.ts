import mongoose, { Schema, Document } from 'mongoose';

export interface IAuthNonce extends Document {
  walletAddress: string;
  nonce: string;
  expiresAt: Date;
  createdAt: Date;
}

const AuthNonceSchema = new Schema<IAuthNonce>(
  {
    walletAddress: {
      type: String,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete expired nonces
AuthNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthNonceSchema.index({ walletAddress: 1 });
// nonce is already indexed via unique: true

export const AuthNonce = mongoose.model<IAuthNonce>('AuthNonce', AuthNonceSchema);
