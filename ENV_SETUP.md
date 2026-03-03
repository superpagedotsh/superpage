# SuperPage — Production Environment Setup

Complete guide to obtain and configure all environment variables before going to production.

---

## Quick Checklist

| # | Variable | Service | Status |
|---|----------|---------|--------|
| 1 | `JWT_SECRET` | Backend | Generate locally |
| 2 | `MONGODB_URI` | Backend | [MongoDB Atlas](#1-mongodb) |
| 3 | `WALLET_PRIVATE_KEY` | Backend + Agent + MCP | [Your wallet](#2-wallet--blockchain) |
| 4 | `X402_RECIPIENT_ADDRESS` | Backend | Your wallet address |
| 5 | `SHOPIFY_API_KEY` | Backend | [Shopify Partners](#3-shopify) |
| 6 | `SHOPIFY_CLIENT_SECRET` | Backend | [Shopify Partners](#3-shopify) |
| 7 | `ANTHROPIC_API_KEY` | AI Agent | [Anthropic Console](#4-llm-providers) |
| 8 | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Frontend | [WalletConnect Cloud](#5-walletconnect) |
| 9 | `APP_URL` | Backend | Your domain |
| 10 | `FRONTEND_URL` | Backend | Your domain |

---

## Full `.env.production` Template

Copy this to your root `.env.production` and fill in all values:

```env
# ==============================================
# SERVER
# ==============================================
PORT=3001
PAYMENT_SERVER_PORT=3002
NODE_ENV=production

# Your deployed backend domain (no trailing slash)
# Example: https://api.superpage.sh
APP_URL=https://YOUR_BACKEND_DOMAIN

# Your deployed frontend domain
# Example: https://superpage.sh
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
BACKEND_URL=https://YOUR_BACKEND_DOMAIN

# ==============================================
# DATABASE — MongoDB Atlas
# Get URI from: https://cloud.mongodb.com
# ==============================================
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/superpage?retryWrites=true&w=majority

# ==============================================
# AUTH
# Generate: openssl rand -hex 32
# ==============================================
JWT_SECRET=CHANGE_ME_RANDOM_64_CHAR_HEX

# ==============================================
# SHOPIFY OAUTH
# Get from: https://partners.shopify.com → Apps → Your App → Client credentials
# ==============================================
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_CLIENT_SECRET=your-shopify-client-secret

# ==============================================
# WALLET / BLOCKCHAIN — Base Sepolia
# ==============================================
# EVM private key of the platform wallet (receives + verifies payments)
# WARNING: Never commit this. Use secrets manager in production.
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETH_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Address that receives USDC payments
X402_RECIPIENT_ADDRESS=0xYOUR_RECIPIENT_ADDRESS
ETH_RECIPIENT_ADDRESS=0xYOUR_RECIPIENT_ADDRESS

# Chain config (Base Sepolia testnet)
X402_CHAIN=base-sepolia
X402_CURRENCY=USDC
USDC_ADDRESS=0xa059e27967e5a573a14a62c706ebd1be75333f9a
RPC_URL=https://sepolia.base.org

# ==============================================
# ERC-8004 IDENTITY (optional, fill after first registration)
# ==============================================
ERC8004_AGENT_ID=0

# ==============================================
# LLM — AI Agent
# Pick ONE provider, comment out the others
# ==============================================
LLM_PROVIDER=anthropic

# Anthropic — get from: https://console.anthropic.com/settings/api-keys
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI — get from: https://platform.openai.com/api-keys
# OPENAI_API_KEY=sk-...

# Google — get from: https://aishudio.google.com or https://console.cloud.google.com
# GOOGLE_GENERATIVE_AI_API_KEY=...

# Optional: override default model
# LLM_MODEL=claude-sonnet-4-6

# ==============================================
# FRONTEND — Build-time (baked at next build)
# ==============================================
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_DOMAIN
NEXT_PUBLIC_X402_CHAIN=base-sepolia
NEXT_PUBLIC_X402_CURRENCY=USDC

# WalletConnect Project ID — get from: https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id

# ==============================================
# AI AGENT BEHAVIOR
# ==============================================
MAX_STEPS=20
AUTO_APPROVE_PAYMENTS=false
VERBOSE=false
MAX_AUTO_PAYMENT=10.00
```

---

## Step-by-Step Guide

### 1. MongoDB

> Database for resources, orders, users, and Shopify stores.

1. Go to **[MongoDB Atlas](https://cloud.mongodb.com)**
2. Create a free cluster (M0 Sandbox is sufficient for getting started)
3. **Database Access** → Add user with read/write on `superpage` database
4. **Network Access** → Add `0.0.0.0/0` to allow all IPs (required for cloud hosting / Codespaces)
5. **Connect** → Drivers → Copy the connection string

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/superpage?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your database user credentials.

---

### 2. Wallet & Blockchain

> EVM wallet for receiving payments and signing transactions on Base Sepolia.

#### Option A — Use an existing wallet

Export the private key from MetaMask: **Account Details → Export private key**

#### Option B — Generate a new wallet

```bash
# Using cast (Foundry)
cast wallet new

# Or using Node.js
node -e "const {ethers}=require('ethers'); const w=ethers.Wallet.createRandom(); console.log('address:', w.address); console.log('key:', w.privateKey)"
```

#### Get test USDC on Base Sepolia

- **Base Sepolia Faucet (ETH):** [https://www.alchemy.com/faucets/base-sepolia](https://www.alchemy.com/faucets/base-sepolia)
- **Circle USDC Faucet:** [https://faucet.circle.com](https://faucet.circle.com) — select Base Sepolia
- **SuperPage built-in faucet:** `http://localhost:3000/faucet` (after starting dev)

#### Verify on Explorer

- **Base Sepolia Explorer:** [https://sepolia.basescan.org](https://sepolia.basescan.org)

---

### 3. Shopify

> Required for Shopify store integration and product sync. Skip if not using e-commerce.

1. Go to **[Shopify Partners](https://partners.shopify.com)**
2. **Apps** → Create app → Custom app
3. Set the redirect URL to: `https://YOUR_BACKEND_DOMAIN/shopify/callback`
4. Copy **Client ID** → `SHOPIFY_API_KEY`
5. Copy **Client secret** → `SHOPIFY_CLIENT_SECRET`

Required scopes: `read_products`, `write_orders`, `read_orders`

---

### 4. LLM Providers

> API key for the AI agent. Choose one.

#### Anthropic (Recommended)

1. Go to **[Anthropic Console](https://console.anthropic.com/settings/api-keys)**
2. **API Keys** → Create key
3. Copy → `ANTHROPIC_API_KEY=sk-ant-...`

#### OpenAI

1. Go to **[OpenAI Platform](https://platform.openai.com/api-keys)**
2. **API Keys** → Create new secret key
3. Copy → `OPENAI_API_KEY=sk-...`

#### Google Gemini

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. **Create API key**
3. Copy → `GOOGLE_GENERATIVE_AI_API_KEY=...`

---

### 5. WalletConnect

> Required for browser wallet connect (RainbowKit) on the frontend.

1. Go to **[WalletConnect Cloud](https://cloud.walletconnect.com)**
2. **Create Project** → Web → Enter your domain
3. Copy **Project ID** → `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

---

### 6. JWT Secret

> Used to sign authentication tokens. Must be random and secret.

Generate locally:

```bash
openssl rand -hex 32
```

Copy the output → `JWT_SECRET=...`

---

### 7. RPC URL (optional override)

Default is the public Base Sepolia RPC (`https://sepolia.base.org`). For production with higher rate limits, use a dedicated node provider:

| Provider | Free Tier | Link |
|----------|-----------|------|
| Alchemy | 300M compute units/month | [alchemy.com](https://www.alchemy.com) |
| Infura | 100K req/day | [infura.io](https://www.infura.io) |
| QuickNode | 10M credits/month | [quicknode.com](https://www.quicknode.com) |

After creating a Base Sepolia endpoint, set:

```env
RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

---

## MCP Client Config (Claude Desktop)

After filling the backend env, configure Claude Desktop to use the MCP server:

**File:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
**File:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "superpage-x402": {
      "command": "node",
      "args": ["/absolute/path/to/superpage/packages/mcp-client/superpage-x402.js"],
      "env": {
        "SUPERPAGE_SERVER": "https://YOUR_BACKEND_DOMAIN",
        "WALLET_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY",
        "X402_CHAIN": "base-sepolia",
        "X402_CURRENCY": "USDC",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}
```

---

## AI Agent `.env` (packages/ai-agent)

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
MERCHANT_URL=https://YOUR_BACKEND_DOMAIN
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
MAX_STEPS=20
AUTO_APPROVE_PAYMENTS=false
VERBOSE=false
```

---

## Blockchain Contract Addresses (pre-deployed, read-only)

No deployment needed. All contracts are live on Base Sepolia:

| Contract | Address | Explorer |
|----------|---------|---------|
| USDC | `0xa059e27967e5a573a14a62c706ebd1be75333f9a` | [View](https://sepolia.basescan.org/token/0xa059e27967e5a573a14a62c706ebd1be75333f9a) |
| ERC-8004 Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | [View](https://sepolia.basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432) |
| ERC-8004 Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` | [View](https://sepolia.basescan.org/address/0x8004BAa17C55a88189AE136b182e5fdA19dE9b63) |

---

## Security Notes

- **Never commit `.env` or `.env.production`** — both are in `.gitignore`
- Store `WALLET_PRIVATE_KEY` in a secrets manager (AWS Secrets Manager, Doppler, Infisical) for production
- Rotate `JWT_SECRET` if you suspect it has been leaked — this invalidates all active sessions
- Set `AUTO_APPROVE_PAYMENTS=false` in production so the agent always confirms before paying
