/**
 * Real Ethereum Purchase Flow
 * Complete end-to-end purchase with MNT
 */

import "dotenv/config";
import { X402Client } from "../../x402-sdk-eth/dist/index.js";
import { privateKeyToAccount } from "viem/accounts";

const BACKEND_URL = "http://localhost:3001";
const PRIVATE_KEY = process.env.ETH_PRIVATE_KEY!;
const NETWORK = (process.env.ETH_NETWORK || "mainnet") as "mainnet" | "sepolia";

async function purchaseProduct() {
  console.log("\n🛒 Ethereum Product Purchase with MNT\n");
  console.log("=".repeat(60));

  try {
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    console.log("Wallet:", account.address);
    console.log("Network:", NETWORK);

    // Initialize x402 client with longer confirmation time
    const client = new X402Client({
      network: NETWORK,
      signer: PRIVATE_KEY as any,
      confirmations: 2, // Wait for 2 confirmations for safety
      autoRetry: true,
      maxRetries: 3,
    });

    // Step 1: Get stores
    console.log("\n1️⃣  Fetching stores...");
    const storesRes = await fetch(`${BACKEND_URL}/x402/stores`);
    const storesData: any = await storesRes.json();
    const stores = storesData.stores || [];
    
    if (stores.length === 0) {
      console.error("❌ No stores found!");
      return;
    }
    
    const store = stores[0];
    console.log(`✅ Store: ${store.name}`);

    // Step 2: Get products
    console.log(`\n2️⃣  Fetching products...`);
    const productsRes = await fetch(`${BACKEND_URL}/x402/store-products`);
    const productsData: any = await productsRes.json();
    const allProducts = productsData.products || [];
    const products = allProducts.filter((p: any) => p.storeId === store.id);
    
    if (products.length === 0) {
      console.error("❌ No products found!");
      return;
    }
    
    // Find cheapest product
    const product = products.reduce((min: any, p: any) => 
      parseFloat(p.price) < parseFloat(min.price) ? p : min
    );
    
    console.log(`✅ Product: ${product.name}`);
    console.log(`   Price: $${product.price} USD`);
    console.log(`   Will pay: ${product.price} MNT`);

    // Step 3: Make purchase
    console.log(`\n3️⃣  Initiating purchase...`);
    const encodedStoreId = encodeURIComponent(store.id);
    const encodedProductId = encodeURIComponent(product.id);
    const gatewayUrl = `${BACKEND_URL}/x402/eth/store/${encodedStoreId}/product/${encodedProductId}`;
    
    console.log(`   Gateway: ${gatewayUrl.substring(0, 80)}...`);
    console.log(`   Sending MNT payment...`);
    console.log(`   (This will wait for blockchain confirmations)`);
    
    const startTime = Date.now();
    const response = await client.fetch(gatewayUrl);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`   ⏱️  Completed in ${duration}s`);
    
    if (!response.ok) {
      console.error(`\n❌ Purchase failed with status: ${response.status}`);
      const error = await response.json();
      console.error("Error:", JSON.stringify(error, null, 2));
      return;
    }

    const data: any = await response.json();
    
    // Step 4: Display results
    console.log(`\n✅ Purchase Successful! 🎉\n`);
    console.log("=".repeat(60));
    console.log("\n📦 ORDER DETAILS");
    console.log("-".repeat(60));
    console.log(`Order ID:        ${data.orderId}`);
    console.log(`Shopify Order:   ${data.shopifyOrderId || 'N/A'}`);
    console.log(`Status:          ${data.success ? 'Confirmed' : 'Pending'}`);
    
    console.log("\n🛍️  PRODUCT");
    console.log("-".repeat(60));
    console.log(`Name:            ${data.product.name}`);
    console.log(`Price:           $${data.product.price} ${data.product.currency}`);
    console.log(`Description:     ${data.product.description || 'N/A'}`);
    
    console.log("\n💳 PAYMENT");
    console.log("-".repeat(60));
    console.log(`Amount:          ${data.payment.amount} ${data.payment.token}`);
    console.log(`Network:         ${data.payment.network}`);
    console.log(`Verified:        ${data.payment.verified ? '✅ Yes' : '❌ No'}`);
    console.log(`Transaction:     ${data.payment.transactionHash}`);
    
    console.log("\n🔗 LINKS");
    console.log("-".repeat(60));
    console.log(`Etherscan:       https://etherscan.io/tx/${data.payment.transactionHash}`);
    if (data.shopifyOrderId) {
      const shopDomain = store.shopDomain?.replace('.myshopify.com', '') || 'yf8vem-uw';
      console.log(`Shopify Admin:   https://admin.shopify.com/store/${shopDomain}/orders`);
    }
    
    if (data.warning) {
      console.log(`\n⚠️  WARNING: ${data.warning}`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log(`\n✅ Order successfully created and saved!\n`);

  } catch (error: any) {
    console.error("\n❌ Purchase Failed!");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds") || error.message.includes("gas")) {
      console.log("\n💡 You need more ETH for gas fees!");
    } else if (error.message.includes("confirmations")) {
      console.log("\n💡 Transaction sent but not enough confirmations yet");
      console.log("   Check your wallet for the transaction");
    }
    
    console.log("\n");
    process.exit(1);
  }
}

// Run the purchase
purchaseProduct();
