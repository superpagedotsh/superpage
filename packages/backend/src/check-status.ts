/**
 * Check x402 System Status
 */

const BACKEND_URL = "http://localhost:3001";
const FRONTEND_URL = "http://localhost:3000";

async function checkStatus() {
  console.log("\n🔍 x402 System Status Check\n");
  console.log("=".repeat(60));

  // Check Backend
  console.log("\n📡 Backend (Port 3001)");
  try {
    const res = await fetch(`${BACKEND_URL}/x402/eth/test`);
    if (res.status === 402) {
      const data: any = await res.json();
      console.log("  ✅ Backend: Running");
      console.log(`  ✅ Ethereum: Configured (${data.network})`);
      console.log(`  ✅ MNT: ${data.token}`);
      console.log(`  ✅ Recipient: ${data.recipient}`);
    }
  } catch (err) {
    console.log("  ❌ Backend: Not responding");
  }

  // Check Stores
  console.log("\n🏪 Stores");
  try {
    const res = await fetch(`${BACKEND_URL}/x402/stores`);
    const data: any = await res.json();
    const stores = data.stores || [];
    console.log(`  ✅ ${stores.length} store(s) connected`);
    stores.forEach((store: any) => {
      console.log(`     - ${store.name} (${store.id})`);
    });
  } catch (err) {
    console.log("  ❌ Could not fetch stores");
  }

  // Check Products
  console.log("\n📦 Products");
  try {
    const res = await fetch(`${BACKEND_URL}/x402/store-products`);
    const data: any = await res.json();
    const products = data.products || [];
    console.log(`  ✅ ${products.length} product(s) available`);
  } catch (err) {
    console.log("  ❌ Could not fetch products");
  }

  // Check Orders
  console.log("\n📋 Orders");
  try {
    const res = await fetch(`${BACKEND_URL}/x402/stores`);
    const data: any = await res.json();
    const stores = data.stores || [];
    
    if (stores.length > 0) {
      const storeId = encodeURIComponent(stores[0].id);
      const ordersRes = await fetch(`${BACKEND_URL}/x402/stores/${storeId}/orders`);
      const orders: any = await ordersRes.json();
      console.log(`  ✅ ${orders.length} order(s) total`);
      
      const ethOrders = orders.filter((o: any) => o.id.startsWith('eth_ord_'));
      console.log(`     - ${ethOrders.length} Ethereum/MNT order(s)`);
    }
  } catch (err) {
    console.log("  ❌ Could not fetch orders");
  }

  // Check Frontend
  console.log("\n🌐 Frontend (Port 3000)");
  try {
    const res = await fetch(FRONTEND_URL);
    if (res.ok) {
      console.log("  ✅ Frontend: Running");
      console.log(`     Dashboard: ${FRONTEND_URL}/dashboard`);
      console.log(`     Orders: ${FRONTEND_URL}/dashboard/orders`);
    }
  } catch (err) {
    console.log("  ❌ Frontend: Not responding");
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✅ Status check complete!\n");
}

checkStatus();
