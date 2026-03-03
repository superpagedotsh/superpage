import { tool } from "ai";
import { z } from "zod";
import type { A2AClient } from "../a2a-client.js";

export function createBrowseTools(client: A2AClient) {
  const listStores = tool({
    description:
      "List all stores available on the merchant. Returns store IDs and names.",
    parameters: z.object({}),
    execute: async () => {
      const stores = await client.listStores();
      return {
        stores: stores.map((s: any) => ({
          id: s._id || s.id,
          name: s.name,
          description: s.description,
          productCount: s.products?.length,
        })),
      };
    },
  });

  const listProducts = tool({
    description:
      "List products available in a specific store. Returns product IDs, names, and prices.",
    parameters: z.object({
      storeId: z.string().describe("The store ID to list products from"),
    }),
    execute: async ({ storeId }) => {
      const products = await client.listProducts(storeId);
      return {
        products: products.map((p: any) => ({
          id: p._id || p.id,
          name: p.name || p.title,
          price: p.price,
          description: p.description?.slice(0, 200),
        })),
      };
    },
  });

  const listResources = tool({
    description:
      "List all payment-gated resources (APIs, files, content). Returns resource slugs, names, prices, and types. Use the 'slug' field when calling access_resource.",
    parameters: z.object({}),
    execute: async () => {
      const resources = await client.listResources();
      return {
        resources: resources.map((r: any) => ({
          slug: r.slug || r._id || r.id,
          name: r.name || r.title,
          priceUsdc: r.priceUsdc || r.price,
          type: r.type,
          description: r.description?.slice(0, 200),
        })),
      };
    },
  });

  return { listStores, listProducts, listResources };
}
