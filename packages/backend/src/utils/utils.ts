import crypto from "crypto";
import { CheckoutRequest } from "../types";

export function deriveNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const sub = host.replace(".myshopify.com", "");
    return sub
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  } catch {
    return "Shopify Store";
  }
}

export function toCentsStr(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function hashRequestBody(
  req: Omit<CheckoutRequest, "orderIntentId">
): string {
  const normalized = JSON.stringify({
    storeId: req.storeId,
    items: req.items
      .map((i) => ({
        productId: String(i.productId),
        quantity: Number(i.quantity),
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
    shippingAddress: req.shippingAddress,
    email: req.email,
    clientReferenceId: req.clientReferenceId ?? null,
  });
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function normalizePriceString(price: any): string {
  const priceVal = price;
  const priceStr =
    typeof priceVal === "number"
      ? priceVal.toFixed(2)
      : typeof priceVal === "string"
      ? priceVal
      : "0.00";
  return priceStr;
}
