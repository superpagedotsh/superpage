/**
 * x402 Ethereum Gateway
 * Handles payment-gated access using configurable currency on configurable chain
 */

import { Request, Response } from "express";
import { StoreProduct, Store, Order } from "../models/index.js";
import { getChainConfig, getNetwork, getCurrency, SPAY_SCHEME } from "../config/chain-config.js";

// Import from local x402-sdk eth-utils
import {
  createConnection,
  verifyPaymentTransaction,
  type PaymentRequirements,
  type PaymentProof,
  getChainId,
} from "../x402-sdk/eth-utils.js";

const ETH_RECIPIENT_ADDRESS = process.env.ETH_RECIPIENT_ADDRESS || process.env.X402_RECIPIENT_ADDRESS || "";

/**
 * Gateway for Ethereum-based store products
 * GET /x402/eth/store/:storeId/product/:productId
 */
export async function handleEthStoreProductAccess(req: Request, res: Response) {
  try {
    const { storeId, productId } = req.params;

    // Find the product
    const product = await StoreProduct.findOne({
      storeId,
      variantId: productId,
    }).lean();

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check for payment proof in X-Payment header
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      // No payment provided, return 402 with payment requirements
      const config = getChainConfig();
      const requirements: PaymentRequirements = {
        scheme: SPAY_SCHEME,
        network: config.network as any,
        chainId: getChainId(config.network as any),
        amount: convertPriceToBaseUnits(product.price, config.tokenDecimals),
        token: config.currency,
        recipient: ETH_RECIPIENT_ADDRESS,
        requestId: `store_${storeId}_product_${productId}_${Date.now()}`,
        memo: `Purchase: ${product.name}`,
      };

      return res.status(402).json(requirements);
    }

    // Parse and verify payment proof
    let proof: PaymentProof;
    try {
      proof = JSON.parse(paymentHeader);
    } catch (error) {
      return res.status(400).json({ error: "Invalid payment proof format" });
    }

    // Verify the payment on-chain
    const config = getChainConfig();
    console.log(`[ETH] 🔐 Verifying payment...`);
    console.log(`[ETH]   TX Hash: ${proof.transactionHash}`);
    console.log(`[ETH]   Network: ${proof.network}`);
    console.log(`[ETH]   Expected amount: ${convertPriceToBaseUnits(product.price, config.tokenDecimals)}`);
    
    const publicClient = createConnection(config.network as any);
    
    const requirements = {
      scheme: SPAY_SCHEME as any,
      network: config.network,
      chainId: getChainId(config.network as any),
      amount: convertPriceToBaseUnits(product.price, config.tokenDecimals),
      token: config.currency as any,
      recipient: ETH_RECIPIENT_ADDRESS,
    };

    const isValid = await verifyPaymentTransaction(
      publicClient,
      proof.transactionHash as `0x${string}`,
      requirements as any, // Type assertion for cross-package compatibility
      1 // 1 confirmation for testing
    );

    console.log(`[ETH]   Verification result: ${isValid}`);

    if (!isValid) {
      console.error(`[ETH] ❌ Payment verification failed!`);
      return res.status(402).json({
        error: "Payment verification failed",
        requirements,
      });
    }

    // Payment verified! Create Shopify order
    console.log(`[ETH] ✅ Payment verified! Creating Shopify order...`);

    try {
      // Get store details for Shopify API
      const store = await Store.findOne({ id: storeId }).lean();
      
      if (!store || !store.adminAccessToken) {
        console.error(`[ETH] ❌ Store not found or missing access token: ${storeId}`);
        return res.status(500).json({
          error: "Store configuration error",
          message: "Unable to create order - store not properly configured",
        });
      }

      // Create Shopify order
      const shopUrl = (store.shopDomain || store.url)?.replace(/\/$/, "");
      const apiVersion = "2025-10";
      const endpoint = `https://${shopUrl}/admin/api/${apiVersion}/orders.json`;

      // Extract variant ID number from Shopify GID
      const match = String(productId).match(/(\d+)$/);
      const variantIdNum = match ? Number(match[1]) : undefined;

      const orderPayload = {
        order: {
          email: "customer@x402.io", // Default email - could be passed in request
          financial_status: "paid",
          currency: product.currency || "USD",
          line_items: [
            {
              variant_id: variantIdNum,
              quantity: 1,
            },
          ],
          transactions: [
            {
              kind: "sale",
              status: "success",
              amount: product.price,
              currency: product.currency || "USD",
              gateway: "x402-ethereum",
            },
          ],
          tags: "x402,ethereum",
          note: `Paid with ${getCurrency()} on ${getNetwork()}. TX: ${proof.transactionHash}`,
        },
      };

      console.log(`[ETH] 📤 Sending order to Shopify: ${endpoint}`);
      
      const shopifyRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": String(store.adminAccessToken),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      console.log(`[ETH] 📥 Shopify response: ${shopifyRes.status} ${shopifyRes.statusText}`);

      if (!shopifyRes.ok) {
        const errorText = await shopifyRes.text();
        console.error(`[ETH] ❌ Shopify order creation failed:`, errorText);
        
        // Payment was verified but order creation failed
        // Return success with warning
        return res.json({
          success: true,
          warning: "Payment verified but order creation failed",
          product: {
            id: product.variantId,
            name: product.name,
            price: product.price,
            currency: product.currency,
          },
          payment: {
            verified: true,
            transactionHash: proof.transactionHash,
            network: proof.network,
            token: getCurrency(),
          },
          shopifyError: errorText,
        });
      }

      const shopifyData: any = await shopifyRes.json();
      const shopifyOrderId = shopifyData?.order?.admin_graphql_api_id || 
                            String(shopifyData?.order?.id || "");

      console.log(`[ETH] ✅ Shopify order created: ${shopifyOrderId}`);

      // Create local order record
      const orderId = `eth_ord_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await Order.create({
        id: orderId,
        storeId,
        email: "customer@x402.io",
        items: [{
          productId: product.variantId,
          quantity: 1,
          price: product.price,
        }],
        subtotalAmount: product.price,
        shippingAmount: "0.00",
        taxAmount: "0.00",
        totalAmount: product.price,
        currency: product.currency || "USD",
        status: "confirmed",
        shopifyOrderId,
      });

      console.log(`[ETH] ✅ Local order created: ${orderId}`);

      // Return success with order details
      return res.json({
        success: true,
        orderId,
        shopifyOrderId,
        product: {
          id: product.variantId,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency,
          image: product.image,
        },
        payment: {
          verified: true,
          transactionHash: proof.transactionHash,
          network: proof.network,
          amount: product.price,
          token: "MNT",
        },
        message: "Payment verified and order created successfully!",
      });
    } catch (orderError) {
      console.error("[ETH] ❌ Order creation error:", orderError);
      
      // Payment was verified but order creation failed
      return res.json({
        success: true,
        warning: "Payment verified but order creation failed",
        product: {
          id: product.variantId,
          name: product.name,
          price: product.price,
          currency: product.currency,
        },
        payment: {
          verified: true,
          transactionHash: proof.transactionHash,
          network: proof.network,
          token: "MNT",
        },
        error: orderError instanceof Error ? orderError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Eth gateway error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Ethereum-specific checkout endpoint
 * POST /x402/eth/store/:storeId/checkout
 * 
 * This is a wrapper around the main checkout that extracts storeId from URL
 */
export async function handleEthCheckout(req: Request, res: Response) {
  const { storeId } = req.params;
  
  // Add storeId to body if not present
  req.body = {
    ...req.body,
    storeId: storeId || req.body.storeId,
  };
  
  // Import and call the main checkout handler
  const { handleCheckout } = await import("./x402-checkout");
  return handleCheckout(req, res);
}

/**
 * Test endpoint to check if Ethereum setup is working
 * GET /x402/eth/test
 */
export async function handleEthTest(req: Request, res: Response) {
  try {
    const paymentHeader = req.headers["x-payment"] as string | undefined;

    if (!paymentHeader) {
      // Return test payment requirements
      const config = getChainConfig();
      const testAmount = BigInt(10 ** config.tokenDecimals).toString(); // 1.00 token
      const requirements: PaymentRequirements = {
        scheme: SPAY_SCHEME,
        network: config.network as any,
        chainId: getChainId(config.network as any),
        amount: testAmount,
        token: config.currency,
        recipient: ETH_RECIPIENT_ADDRESS,
        requestId: `test_${Date.now()}`,
        memo: "Test payment",
      };

      return res.status(402).json(requirements);
    }

    // Parse proof
    let proof: PaymentProof;
    try {
      proof = JSON.parse(paymentHeader);
    } catch (error) {
      return res.status(400).json({ error: "Invalid payment proof format" });
    }

    // Verify payment
    const config = getChainConfig();
    const publicClient = createConnection(config.network as any);
    const testAmount = BigInt(10 ** config.tokenDecimals).toString();
    
    const requirements = {
      scheme: SPAY_SCHEME as any,
      network: config.network,
      chainId: getChainId(config.network as any),
      amount: testAmount,
      token: config.currency as any,
      recipient: ETH_RECIPIENT_ADDRESS,
    };

    const isValid = await verifyPaymentTransaction(
      publicClient,
      proof.transactionHash as `0x${string}`,
      requirements as any, // Type assertion for cross-package compatibility
      1
    );

    if (!isValid) {
      return res.status(402).json({
        error: "Payment verification failed",
        requirements,
      });
    }

    return res.json({
      success: true,
      message: `Payment verified! ${config.currency} is working! 🎉`,
      payment: {
        transactionHash: proof.transactionHash,
        network: proof.network,
        verified: true,
      },
      config: {
        network: config.network as any,
        currency: config.currency,
        recipientAddress: ETH_RECIPIENT_ADDRESS,
        tokenAddress: config.tokenAddress,
      },
    });
  } catch (error) {
    console.error("Eth test error:", error);
    return res.status(500).json({
      error: "Server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Convert price string to base units with configurable decimals
 * e.g., "19.99" with 18 decimals -> "19990000000000000000"
 */
function convertPriceToBaseUnits(price: string, decimals: number = 18): string {
  const priceFloat = parseFloat(price);
  const multiplier = BigInt(10 ** decimals);
  const baseUnits = BigInt(Math.floor(priceFloat * Number(multiplier)));
  return baseUnits.toString();
}
