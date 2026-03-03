import { Request, Response } from "express";
import { Order, Store, StoreProduct } from "../models/index.js";

/**
 * Get order details by order ID
 * Returns order with store details and enriched product information
 */
export async function handleGetOrderDetails(req: Request, res: Response) {
  const requestId = `order_details_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    const { orderId } = req.params;

    console.log(`[${requestId}] 📋 Get Order Details Request`);
    console.log(`[${requestId}] Order ID: ${orderId}`);

    if (!orderId) {
      console.error(`[${requestId}] ❌ Missing orderId parameter`);
      return res.status(400).json({
        error: "Missing orderId parameter",
      });
    }

    // Fetch order from database (by id field, not _id)
    console.log(`[${requestId}] 🔍 Fetching order from database...`);
    const order = await Order.findOne({ id: orderId }).lean();

    if (!order) {
      console.error(`[${requestId}] ❌ Order not found: ${orderId}`);
      return res.status(404).json({
        error: "Order not found",
      });
    }

    console.log(`[${requestId}] ✅ Order found:`, {
      id: order._id,
      status: order.status,
      total: order.totalAmount,
      currency: order.currency,
    });

    // Fetch store information
    console.log(`[${requestId}] 🏪 Fetching store details for: ${order.storeId}`);
    const store = await Store.findOne({ id: order.storeId }).lean();

    if (!store) {
      console.error(`[${requestId}] ⚠️  Store not found: ${order.storeId}`);
    } else {
      console.log(`[${requestId}] ✅ Store found:`, { id: store.id, name: store.name });
    }

    // Fetch product details for all items in order
    console.log(`[${requestId}] 📦 Fetching product details...`);
    const variantIds = (order.items || []).map((item: any) => item.productId);

    let products: any[] = [];
    if (variantIds.length > 0) {
      products = await StoreProduct.find({
        storeId: order.storeId,
        variantId: { $in: variantIds },
      }).lean();

      console.log(`[${requestId}] ✅ Found ${products.length} products`);
    }

    // Create product map for easy lookup
    const productMap = new Map(products.map((p) => [p.variantId, p]));

    // Enrich items with product details
    const enrichedItems = (order.items || []).map((item: any) => {
      const product = productMap.get(item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        product: product
          ? {
              name: product.name,
              description: product.description,
              image: product.image,
              price: product.price,
              currency: product.currency,
              inventory: product.inventory,
              metadata: product.metadata,
            }
          : null,
      };
    });

    // Build response
    const response = {
      orderId: order.id || order._id,
      orderIntentId: order.orderIntentId,
      email: order.email,
      status: order.status,
      shopifyOrderId: order.shopifyOrderId,
      createdAt: order.createdAt,
      store: store
        ? {
            storeId: store._id,
            name: store.name,
            description: store.description,
            url: store.url,
            currency: store.currency,
          }
        : null,
      items: enrichedItems,
      amounts: {
        subtotal: order.subtotalAmount,
        shipping: order.shippingAmount,
        tax: order.taxAmount,
        total: order.totalAmount,
        currency: order.currency,
      },
      delivery: {
        estimatedTime: "expected in 7 days",
      },
    };

    console.log(`[${requestId}] 📤 Returning enriched order details`);
    return res.status(200).json(response);
  } catch (e: any) {
    console.error(`[${requestId}] ❌ Unexpected error`);
    console.error(`[${requestId}] Error message:`, e?.message);
    console.error(`[${requestId}] Stack trace:`, e?.stack);
    return res.status(500).json({
      error: "Internal server error",
      details: e?.message,
    });
  }
}
