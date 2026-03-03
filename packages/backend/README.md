# x402 Shopify Commerce Backend

A backend service for integrating Shopify stores with HTTP 402 Payment Required protocol for cryptocurrency payments (USDC on Solana).

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Setup Environment
Create a `.env` file:
```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# x402 Configuration
X402_NETWORK=devnet
X402_RECIPIENT_ADDRESS=YourSolanaWalletAddress

# Payment Wallet (for AI agent)
WALLET_SECRET_KEY=YourBase58PrivateKey

# Server Ports
PORT=3001
PAYMENT_SERVER_PORT=3002
```

### 3. Start All Services
```bash
# Option 1: Use npm script
pnpm run dev:all

# Option 2: Use helper script
./start-all.sh
```

This starts:
- **Main Server** (Port 3001): Handles stores, products, checkout, orders
- **Payment Server** (Port 3002): Executes Solana USDC payments

### 4. Test the Flow
```bash
pnpm run test:flow
```

## 📚 Documentation
- **[X402 Flow Guide](./X402_FLOW_GUIDE.md)** - Complete flow documentation with diagrams
- **[Testing Guide](./TESTING.md)** - Testing instructions

## Overview

This backend implements a two-phase checkout system that integrates Shopify e-commerce with blockchain-based payments using the HTTP 402 Payment Required standard. It enables AI agents and applications to browse products, initiate checkout, and finalize orders with cryptocurrency payments.

## Architecture

### Tech Stack
- **Framework**: Express.js (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Solana blockchain (USDC)
- **Protocol**: HTTP 402 Payment Required + JSON-RPC 2.0 (MCP)

## API Endpoints

### Health & Status

#### `GET /health`
Health check endpoint to verify the backend is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

### Store Management

#### `POST /api/stores`
Create a new Shopify store integration.

**Request Body:**
```json
{
  "url": "https://store.myshopify.com",
  "adminAccessToken": "shppa_...",
  "name": "My Store",
  "description": "Store description",
  "currency": "USD",
  "networks": ["solana-devnet"],
  "asset": "USDC",
  "agentMetadata": {
    "minOrder": "5.00",
    "supportsPhysical": true,
    "supportsDigital": false
  }
}
```

**Response:**
```json
{
  "id": "store_xxx",
  "name": "My Store",
  "description": "Store description",
  "currency": "USD",
  "networks": ["solana-devnet"],
  "asset": "USDC",
  "agentMetadata": { ... }
}
```

---

#### `GET /x402/stores`
List all available stores.

**Response:**
```json
[
  {
    "id": "store_xxx",
    "name": "Store Name",
    "url": "https://store.myshopify.com",
    "currency": "USD",
    "description": "Store description"
  }
]
```

---

### Product Management

#### `POST /api/stores/:storeId/products`
Upsert products for a store (usually synced from Shopify).

**Request Body:**
```json
{
  "products": [
    {
      "id": "gid://shopify/ProductVariant/123456",
      "name": "Product Name",
      "description": "Product description",
      "image": "https://...",
      "price": "99.99",
      "currency": "USD",
      "inventory": 10,
      "metadata": { ... }
    }
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "count": 1
}
```

---

#### `GET /x402/stores/:storeId/products`
Get all products available in a store.

**Response:**
```json
{
  "storeId": "store_xxx",
  "products": [
    {
      "id": "gid://shopify/ProductVariant/123456",
      "name": "Product Name",
      "price": "99.99",
      "currency": "USD",
      "image": "https://...",
      "description": "Product description",
      "inventory": 10
    }
  ]
}
```

---

### Checkout Flow (HTTP 402 Payment Required)

The checkout process uses the HTTP 402 Payment Required standard to request payment from the client. It consists of two phases:

#### **PHASE 1: Initiate Checkout**

##### `POST /x402/checkout` (without X-PAYMENT header)

Initiates a checkout and returns payment requirements.

**Request Body:**
```json
{
  "storeId": "store_xxx",
  "items": [
    {
      "productId": "gid://shopify/ProductVariant/123456",
      "quantity": 2
    }
  ],
  "email": "customer@example.com",
  "shippingAddress": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  }
}
```

**Response (HTTP 402):**
```json
{
  "orderIntentId": "oi_abc123",
  "amounts": {
    "subtotal": "199.98",
    "shipping": "0",
    "tax": "0",
    "total": "199.98",
    "currency": "USD"
  },
  "paymentRequirements": [
    {
      "scheme": "MNT-usdc-v1",
      "network": "solana-devnet",
      "asset": "USDC",
      "amount": "199980000",
      "payTo": "wallet_address...",
      "expiresAt": "2025-11-12T12:30:00.000Z",
      "metadata": {
        "orderIntentId": "oi_abc123",
        "amounts": { ... }
      }
    }
  ]
}
```

**What to do next:**
1. Client receives the payment requirements
2. Client executes the Solana transaction with the specified parameters
3. Client gets the transaction signature and proof

---

#### **PHASE 2: Finalize Checkout**

##### `POST /x402/checkout` (with X-PAYMENT header)

Finalizes the checkout after payment has been made. Include the payment proof in the `X-PAYMENT` header.

**Request Headers:**
```
X-PAYMENT: {"signature":"...", "network":"solana-devnet", "timestamp":1234567890}
```

**Request Body:**
```json
{
  "storeId": "store_xxx",
  "orderIntentId": "oi_abc123",
  "items": [
    {
      "productId": "gid://shopify/ProductVariant/123456",
      "quantity": 2
    }
  ],
  "email": "customer@example.com",
  "shippingAddress": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  }
}
```

**Response (HTTP 200 - Success):**
```json
{
  "orderId": "ord_xyz789",
  "orderIntentId": "oi_abc123",
  "storeId": "store_xxx",
  "status": "confirmed",
  "shopifyOrderId": "gid://shopify/Order/123456",
  "amounts": {
    "subtotal": "199.98",
    "shipping": "0",
    "tax": "0",
    "total": "199.98",
    "currency": "USD"
  },
  "payment": {
    "verified": true,
    "txHash": "5ZkXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  },
  "delivery": {
    "estimatedTime": "expected in 7 days"
  }
}
```

**Response (HTTP 402 - Payment Verification Failed):**
If payment verification fails, the server returns 402 again with the same payment requirements for retry.

---

### Order Management

#### `GET /x402/orders/:orderId`
Get order details by order ID. Returns enriched data with store and product information.

**Response:**
```json
{
  "orderId": "ord_xyz789",
  "orderIntentId": "oi_abc123",
  "email": "customer@example.com",
  "status": "confirmed",
  "shopifyOrderId": "gid://shopify/Order/123456",
  "createdAt": "2025-11-11T22:20:53.791429+00:00",
  "store": {
    "storeId": "store_xxx",
    "name": "My Store",
    "description": "Store description",
    "url": "https://store.myshopify.com",
    "currency": "USD"
  },
  "items": [
    {
      "productId": "gid://shopify/ProductVariant/123456",
      "quantity": 2,
      "product": {
        "name": "Product Name",
        "description": "Product description",
        "image": "https://...",
        "price": "99.99",
        "currency": "USD",
        "inventory": 10,
        "metadata": { ... }
      }
    }
  ],
  "amounts": {
    "subtotal": "199.98",
    "shipping": "0",
    "tax": "0",
    "total": "199.98",
    "currency": "USD"
  },
  "delivery": {
    "estimatedTime": "expected in 7 days"
  }
}
```

---

#### `GET /x402/stores/:storeId/orders`
Get all orders for a store.

---

#### `GET /x402/stores/:storeId/order-intents`
Get all order intents for a store.

---

## MCP (Model Context Protocol) Integration

### Overview
The backend implements a JSON-RPC 2.0 server that provides tools for AI agents to interact with the checkout system.

### Endpoint
`POST /mcp` - MCP Server endpoint (JSON-RPC 2.0)

### Available Tools

#### 1. `list_stores`
Get a list of all available stores.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_stores",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "stores": [
    {
      "id": "store_xxx",
      "name": "Store Name",
      "url": "https://store.myshopify.com"
    }
  ]
}
```

---

#### 2. `get_store_products`
Get all products from a specific store.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_store_products",
    "arguments": {
      "storeId": "store_xxx"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "storeId": "store_xxx",
  "products": [
    {
      "id": "gid://shopify/ProductVariant/123456",
      "name": "Product Name",
      "price": "99.99",
      "currency": "USD",
      "image": "https://..."
    }
  ]
}
```

---

#### 3. `initiate_checkout` (PHASE 1)
Initiate checkout for selected items.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "initiate_checkout",
    "arguments": {
      "storeId": "store_xxx",
      "items": [
        {
          "productId": "gid://shopify/ProductVariant/123456",
          "quantity": 2
        }
      ],
      "email": "customer@example.com",
      "shippingAddress": {
        "name": "John Doe",
        "address1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94105",
        "country": "US"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "phase": "1_payment_required",
  "orderIntentId": "oi_abc123",
  "amounts": {
    "subtotal": "199.98",
    "shipping": "0",
    "tax": "0",
    "total": "199.98",
    "currency": "USD"
  },
  "paymentRequirements": [ ... ],
  "message": "Payment Required: 199.98 USD"
}
```

---

#### 4. `finalize_checkout` (PHASE 2)
Finalize checkout after payment proof is obtained.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "finalize_checkout",
    "arguments": {
      "storeId": "store_xxx",
      "orderIntentId": "oi_abc123",
      "items": [
        {
          "productId": "gid://shopify/ProductVariant/123456",
          "quantity": 2
        }
      ],
      "email": "customer@example.com",
      "shippingAddress": {
        "name": "John Doe",
        "address1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94105",
        "country": "US"
      },
      "paymentProof": {
        "signature": "5ZkXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "network": "solana-devnet",
        "timestamp": 1234567890
      }
    }
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "phase": "2_order_confirmed",
  "orderId": "ord_xyz789",
  "shopifyOrderId": "gid://shopify/Order/123456",
  "status": "confirmed",
  "amounts": {
    "subtotal": "199.98",
    "shipping": "0",
    "tax": "0",
    "total": "199.98",
    "currency": "USD"
  },
  "message": "Order confirmed! Order ID: ord_xyz789"
}
```

---

#### 5. `get_order_details`
Get order details by order ID.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_order_details",
    "arguments": {
      "orderId": "ord_xyz789"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderId": "ord_xyz789",
    "orderIntentId": "oi_abc123",
    "email": "customer@example.com",
    "status": "confirmed",
    "shopifyOrderId": "gid://shopify/Order/123456",
    "createdAt": "2025-11-11T22:20:53.791429+00:00",
    "store": { ... },
    "items": [ ... ],
    "amounts": { ... },
    "delivery": {
      "estimatedTime": "expected in 7 days"
    }
  }
}
```

---

## HTTP 402 Payment Required System

### What is HTTP 402?
HTTP 402 Payment Required is an HTTP status code that indicates the server requires payment before processing a request. This backend uses it to implement a payment flow following the `x402` specification.

### Payment Flow

1. **Client requests checkout** (Phase 1)
   - Client sends checkout request without payment proof
   - Server returns HTTP 402 with payment requirements

2. **Client executes payment**
   - Client extracts payment requirements from 402 response
   - Client creates a Solana transaction with specified parameters
   - Client submits transaction to Solana network
   - Client receives transaction signature

3. **Client finalizes checkout** (Phase 2)
   - Client sends checkout request again with payment proof (X-PAYMENT header)
   - Server verifies the payment
   - If verified, server creates order in Shopify and returns HTTP 200
   - If verification fails, server returns HTTP 402 for retry

### Payment Requirements Format

```json
{
  "scheme": "MNT-usdc-v1",
  "network": "solana-devnet",
  "asset": "USDC",
  "amount": "199980000",
  "payTo": "wallet_address...",
  "expiresAt": "2025-11-12T12:30:00.000Z",
  "metadata": {
    "orderIntentId": "oi_abc123",
    "amounts": { ... }
  }
}
```

**Fields:**
- `scheme`: Protocol identifier (x402 with Solana and USDC)
- `network`: Solana network (solana-devnet or solana-mainnet)
- `asset`: Token to pay with (USDC)
- `amount`: Amount in token base units (6 decimals for USDC)
- `payTo`: Recipient wallet address
- `expiresAt`: Payment expiration time (ISO 8601)
- `metadata`: Additional order information

### Payment Verification

When a client finalizes checkout with the X-PAYMENT header:

1. Server extracts payment proof from header
2. Server calls x402 middleware to verify the payment
3. Middleware checks:
   - Signature is valid
   - Transaction exists on blockchain
   - Payment amount matches
   - Payment is to correct recipient
   - Payment not expired
4. If all checks pass, order is created
5. If any check fails, HTTP 402 is returned for retry

---

## Database Schema

### Tables

#### `stores`
- `id` (string): Store ID
- `name` (string): Store name
- `url` (string): Shopify store URL
- `shop_domain` (string): Shop domain
- `admin_access_token` (string): Shopify API token
- `description` (text): Store description
- `currency` (string): Default currency
- `networks` (array): Supported blockchain networks
- `asset` (string): Payment asset (e.g., USDC)
- `agent_metadata` (json): Agent configuration

#### `store_products`
- `store_id` (string): Reference to store
- `variant_id` (string): Shopify variant ID
- `name` (string): Product name
- `description` (text): Product description
- `image` (string): Product image URL
- `price` (string): Product price
- `currency` (string): Product currency
- `inventory` (number): Inventory quantity
- `metadata` (json): Additional metadata

#### `order_intents`
- `id` (string): Order intent ID
- `store_id` (string): Reference to store
- `items` (json): Cart items
- `shipping_address` (json): Shipping address
- `email` (string): Customer email
- `subtotal_amount` (string): Subtotal
- `shipping_amount` (string): Shipping cost
- `tax_amount` (string): Tax amount
- `total_amount` (string): Total amount
- `currency` (string): Currency
- `status` (string): Status (pending, paid)
- `expires_at` (timestamp): Expiration time
- `body_hash` (string): SHA256 hash of request body
- `x402_requirements` (json): Payment requirements
- `verified_at` (timestamp): Verification time
- `verification_status` (string): Verification result
- `payment_tx_hash` (string): Solana transaction hash
- `payment_header_b64` (string): Encoded payment proof

#### `orders`
- `id` (string): Order ID
- `store_id` (string): Reference to store
- `order_intent_id` (string): Reference to order intent
- `email` (string): Customer email
- `items` (json): Ordered items
- `subtotal_amount` (string): Subtotal
- `shipping_amount` (string): Shipping cost
- `tax_amount` (string): Tax amount
- `total_amount` (string): Total amount
- `currency` (string): Currency
- `status` (string): Order status (confirmed, etc)
- `shopify_order_id` (string): Shopify order ID
- `created_at` (timestamp): Creation time

---

## Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Solana
WALLET_SECRET_KEY=base58-encoded-private-key
X402_RECIPIENT_ADDRESS=wallet-address

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

---

## Running the Backend

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and database

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required variables:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Start development server:
```bash
npm run dev
```

Server will run on `http://localhost:3001`

---

## Security Considerations

1. **API Keys**: All Shopify and Solana keys are stored in environment variables
2. **Payment Verification**: All payments are verified on-chain before order creation
3. **Order Integrity**: Request body hash prevents cart tampering between checkout phases
4. **Expiration**: Order intents expire after 15 minutes
5. **CORS**: Configured to accept requests only from authorized frontend URLs

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (missing/invalid parameters)
- `402`: Payment required or verification failed
- `404`: Resource not found
- `500`: Server error
- `502`: Shopify integration error

Error responses include:
```json
{
  "error": "Error message",
  "details": "Additional details if available"
}
```

---

## Integration Examples

See `/packages/frontend` for client-side integration examples with Web3.js and Solana.
