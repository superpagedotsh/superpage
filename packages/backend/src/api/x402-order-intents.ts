import { Request, Response } from "express";
import { OrderIntent } from "../models/index.js";

export type OrderIntentType = {
  id: string;
  store: string;
  items: any[];
  shippingAddress: any;
  email: string;
  subtotalAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: "pending" | "paid" | "expired";
  expiresAt: Date;
  paidAt: Date | null;
  createdAt: Date;
  x402Requirements?: any;
  verificationStatus?: string;
  paymentTxHash?: string;
  paymentAmountAtomic?: string;
  verifiedAt?: Date;
  paymentHeaderB64?: string;
};

export async function handleGetOrderIntents(req: Request, res: Response) {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        error: "Missing storeId parameter",
      });
    }

    const data = await OrderIntent.find({ store: storeId })
      .sort({ createdAt: -1 })
      .lean();

    const orderIntents = (data || []).map((oi: any) => ({
      id: oi._id,
      store_id: oi.store,
      items: oi.items,
      shipping_address: oi.shippingAddress,
      email: oi.email,
      subtotal_amount: oi.subtotalAmount,
      shipping_amount: oi.shippingAmount,
      tax_amount: oi.taxAmount,
      total_amount: oi.totalAmount,
      currency: oi.currency,
      status: oi.status,
      expires_at: oi.expiresAt,
      paid_at: oi.paidAt,
      created_at: oi.createdAt,
      x402_requirements: oi.x402Requirements,
      verification_status: oi.verificationStatus,
      payment_tx_hash: oi.paymentTxHash,
      payment_amount_atomic: oi.paymentAmountAtomic,
      verified_at: oi.verifiedAt,
      payment_header_b64: oi.paymentHeaderB64,
    }));

    return res.status(200).json(orderIntents);
  } catch (e: any) {
    console.error("[GetOrderIntents] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
