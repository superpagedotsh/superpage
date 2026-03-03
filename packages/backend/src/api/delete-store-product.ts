import { Request, Response } from "express";
import { StoreProduct } from "../models/index.js";

export async function handleDeleteStoreProduct(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        error: "Missing productId",
      });
    }

    const result = await StoreProduct.findByIdAndDelete(productId);

    if (!result) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    console.log(`✅ Deleted product: ${result.name} (${productId})`);

    return res.status(200).json({ ok: true, deleted: productId });
  } catch (e: any) {
    console.error("[DeleteStoreProduct] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
