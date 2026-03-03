/**
 * Link Store to Creator
 * 
 * Endpoint to link an existing store to a creator after OAuth
 */

import { Response } from "express";
import { Store } from "../models/index.js";
import { AuthenticatedRequest } from "./wallet-auth";

/**
 * POST /api/stores/:storeId/link
 * Link a store to the authenticated creator
 */
export async function handleLinkStore(req: AuthenticatedRequest, res: Response) {
  try {
    const { storeId } = req.params;

    if (!req.creator) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!storeId) {
      return res.status(400).json({ error: "Missing storeId" });
    }

    // Find the store
    const store = await Store.findOne({ id: storeId });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Check if store is already linked to a different creator
    if (store.creatorId && store.creatorId.toString() !== req.creator.id) {
      return res.status(403).json({ 
        error: "Store is already linked to a different creator" 
      });
    }

    // Link store to creator
    store.creatorId = req.creator.id as any;
    await store.save();

    console.log(`✅ Linked store ${storeId} to creator ${req.creator.id}`);

    return res.status(200).json({ 
      ok: true, 
      message: "Store linked successfully",
      store: {
        id: store.id,
        name: store.name,
        creatorId: store.creatorId?.toString(),
      }
    });
  } catch (e: any) {
    console.error("[LinkStore] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
