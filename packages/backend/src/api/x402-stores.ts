import { Request, Response } from "express";
import { Store } from "../models/index.js";

export async function handleListStores(_req: Request, res: Response) {
  try {
    const stores = await Store.find().select("-adminAccessToken").lean();
    return res.status(200).json({ stores });
  } catch (e: any) {
    console.error("[ListStores] Error:", e);
    return res.status(500).json({
      error: e?.message || "Unexpected error",
    });
  }
}
