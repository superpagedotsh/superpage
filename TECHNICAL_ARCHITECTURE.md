# Technical Architecture - x402 Everything

## 🏗️ System Overview

x402 Everything is a production-grade, full-stack platform enabling autonomous AI agent commerce. This document provides deep technical insight into architecture decisions, implementation patterns, and system design.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Web Browser │  │  Superio CLI │  │ Claude       │              │
│  │  (Next.js)   │  │  Agent       │  │ Desktop +MCP │              │
│  │              │  │              │  │              │              │
│  │ • Dashboard  │  │ • Shopping   │  │ • Tools      │              │
│  │ • Wallet UI  │  │ • Payments   │  │ • Context    │              │
│  │ • Analytics  │  │ • Multi-LLM  │  │ • Memory     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼──────────────────────┘
          │                  │                  │
          │ REST/WebSocket   │ A2A/x402/MCP     │ MCP over stdio
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Application Layer                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Backend (Express)                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │   REST API  │  │  A2A Server │  │ MCP Server  │           │  │
│  │  │  59 routes  │  │  JSON-RPC   │  │  30+ tools  │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │         │                 │                 │                  │  │
│  │         └─────────────────┴─────────────────┘                  │  │
│  │                         │                                      │  │
│  │         ┌───────────────┴───────────────┐                     │  │
│  │         │                               │                     │  │
│  │  ┌──────▼──────┐              ┌────────▼────────┐            │  │
│  │  │  x402       │              │  ERC-8004       │            │  │
│  │  │  Gateway    │              │  Integration    │            │  │
│  │  │             │              │                 │            │  │
│  │  │ • Discovery │              │ • Identity      │            │  │
│  │  │ • Verify    │              │ • Reputation    │            │  │
│  │  │ • Fulfill   │              │ • Validation    │            │  │
│  │  └─────────────┘              └─────────────────┘            │  │
│  │         │                               │                     │  │
│  └─────────┼───────────────────────────────┼─────────────────────┘  │
└───────────┼───────────────────────────────┼────────────────────────┘
            │                               │
            │                               │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Persistence Layer                              │
│  ┌─────────────────────┐            ┌──────────────────────┐        │
│  │   MongoDB           │            │  Blockchain State    │        │
│  │                     │            │                      │        │
│  │ • Creators          │            │ • Payment TXs        │        │
│  │ • Resources         │            │ • Agent Registry     │        │
│  │ • Orders            │            │ • Reputation Records │        │
│  │ • Stores            │            │ • Validation Proofs  │        │
│  │ • Products          │            │                      │        │
│  │ • Access Logs       │            │                      │        │
│  └─────────────────────┘            └──────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Blockchain Layer                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  SKALE Base Sepolia          │  │  Base Sepolia                │ │
│  │  Chain ID: 324705682         │  │  Chain ID: 84532             │ │
│  │                              │  │                              │ │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │ │
│  │  │  mUSDC Token           │  │  │  │  IdentityRegistry      │  │ │
│  │  │  0xa059e27967e5...    │  │  │  │  0x8004...             │  │ │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │ │
│  │                              │  │                              │ │
│  │  Features:                   │  │  ┌────────────────────────┐  │ │
│  │  • Zero gas fees             │  │  │  ReputationRegistry    │  │ │
│  │  • Instant finality          │  │  │  0x8004...             │  │ │
│  │  • EVM compatible            │  │  └────────────────────────┘  │ │
│  │  • BITE v2 ready             │  │                              │ │
│  │                              │  │  ┌────────────────────────┐  │ │
│  │  Use: Payment execution      │  │  │  ValidationRegistry    │  │ │
│  │                              │  │  │  0x8004...             │  │ │
│  │                              │  │  └────────────────────────┘  │ │
│  │                              │  │                              │ │
│  │                              │  │  Use: Identity & Reputation  │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   External Integrations                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  Shopify    │  │  LLM APIs   │  │  RPC Nodes  │                 │
│  │  • OAuth    │  │  • Claude   │  │  • SKALE    │                 │
│  │  • Products │  │  • GPT      │  │  • Base     │                 │
│  │  • Orders   │  │  • Gemini   │  │  • Backup   │                 │
│  │  • Webhooks │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Breakdown

### 1. Backend Service (packages/backend)

**Technology:**
- Express.js 4.21 (HTTP server)
- TypeScript 5.3 (ESM modules)
- MongoDB 8.0 + Mongoose 8.8 (persistence)
- viem 2.44.1 (blockchain interactions)

**Architecture Patterns:**
- **Layered Architecture:** Routes → Controllers → Services → Models
- **Dependency Injection:** Shared clients and utilities
- **Event-Driven:** Shopify webhooks, blockchain events
- **Stateless Design:** All state in MongoDB or on-chain

**Key Services:**

#### x402 Payment Gateway
```typescript
// packages/backend/src/x402/gateway.ts
export class X402Gateway {
  /**
   * 1. Discovery: Return 402 with payment requirements
   * 2. Verification: Validate on-chain transaction
   * 3. Fulfillment: Deliver resource or create order
   */

  async handleResourceAccess(resourceId: string, txHash?: string) {
    const resource = await Resource.findById(resourceId);

    if (!txHash) {
      // No payment → return 402
      return {
        status: 402,
        requirements: this.buildPaymentRequirements(resource)
      };
    }

    // Verify payment on-chain
    const verified = await this.verifyPayment(txHash, resource);

    if (!verified) {
      return { status: 402, error: 'Invalid payment' };
    }

    // Log access
    await AccessLog.create({
      resourceId,
      txHash,
      buyerAddress: verified.from,
      amountPaid: verified.value
    });

    // Deliver resource
    return {
      status: 200,
      content: resource.content
    };
  }

  async verifyPayment(txHash: string, resource: IResource) {
    const publicClient = getPublicClient();

    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`
    });

    // Verify: status, recipient, amount, token
    const isValid =
      receipt.status === 'success' &&
      receipt.to.toLowerCase() === resource.paymentAddress.toLowerCase() &&
      // ... amount checks via token transfer events

    return isValid;
  }
}
```

#### A2A Protocol Handler
```typescript
// packages/backend/src/a2a/handler.ts
export class A2AHandler {
  private taskManager: A2ATaskManager;

  async handleRequest(request: A2ARequest): Promise<A2AResponse> {
    const { method, params } = request;

    switch (method) {
      case 'message/send':
        return this.handleMessage(params);

      case 'tasks/get':
        return this.getTask(params.taskId);

      case 'tasks/cancel':
        return this.cancelTask(params.taskId);

      default:
        throw new Error('Method not found');
    }
  }

  async handleMessage(params: A2AMessageParams) {
    const { action, input } = params;

    // Create task
    const task = await this.taskManager.createTask({
      action,
      input,
      sender: params.sender
    });

    // Determine if payment required
    if (this.requiresPayment(action)) {
      const requirements = await this.generatePaymentRequirements(task);

      task.state = 'input-required';
      task.paymentRequirements = requirements;
    }

    return {
      taskId: task.id,
      state: task.state,
      paymentRequirements: task.paymentRequirements
    };
  }
}
```

#### ERC-8004 Integration
```typescript
// packages/backend/src/erc8004/identity.ts
export async function registerAgent(
  name: string,
  metadataUri: string
): Promise<{ agentId: bigint; txHash: string }> {
  const walletClient = await getWalletClient();

  // Write to IdentityRegistry on Base Sepolia
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY_ADDRESS,
    abi: IdentityRegistryABI,
    functionName: 'registerAgent',
    args: [name, metadataUri],
    chain: baseSepolia
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // Extract agentId from event
  const log = receipt.logs[0];
  const agentId = BigInt(log.topics[1] || '0');

  return { agentId, txHash: hash };
}

// packages/backend/src/erc8004/reputation.ts
export async function giveFeedback(params: GiveFeedbackParams) {
  const walletClient = await getWalletClient();

  const hash = await walletClient.writeContract({
    address: REPUTATION_REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: 'giveFeedback',
    args: [
      BigInt(params.agentId),
      params.rating, // 1-5
      params.comment || ''
    ],
    chain: baseSepolia
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return { success: true, txHash: hash };
}
```

#### MCP Tool Registry
```typescript
// packages/backend/src/mcp/tool-registry.ts
export const toolRegistry = {
  shopping: [
    'list_stores',
    'list_products',
    'get_product_details',
    'search_products'
  ],

  payment: [
    'make_onchain_payment',
    'verify_payment',
    'get_payment_requirements'
  ],

  resources: [
    'list_resources',
    'access_resource',
    'purchase_resource'
  ],

  a2a: [
    'discover_merchant',
    'send_intent_mandate',
    'submit_payment_mandate',
    'check_task_status'
  ],

  erc8004: [
    'erc8004_register_agent',
    'erc8004_get_agent_info',
    'erc8004_give_feedback',
    'erc8004_get_reputation',
    'erc8004_request_validation'
  ]
};

// packages/backend/src/mcp/index.ts
export function createMCPHandler(categories: string[]) {
  const tools = categories.flatMap(cat => toolRegistry[cat] || []);

  return async (request: MCPRequest) => {
    const tool = tools.find(t => t.name === request.tool);

    if (!tool) {
      throw new Error(`Tool not found: ${request.tool}`);
    }

    return await tool.execute(request.params);
  };
}
```

**Database Schema:**

```typescript
// Key models with relationships

Creator (User/Merchant)
├─ username: string (unique)
├─ walletAddress: string (unique)
├─ displayName: string
├─ bio: string
├─ totalSales: number
├─ totalRevenueUsdc: string
└─ resources: Resource[]
   └─ stores: Store[]

Resource (Paid API/Content)
├─ creatorId: ObjectId → Creator
├─ title: string
├─ description: string
├─ priceUsdc: string (6 decimals)
├─ contentType: 'json' | 'text' | 'url'
├─ content: any
├─ paymentAddress: string
├─ network: string
├─ accessCount: number
└─ accessLogs: AccessLog[]

Store (Shopify Integration)
├─ creatorId: ObjectId → Creator
├─ shopDomain: string
├─ adminAccessToken: string (encrypted)
├─ networks: string[] (e.g., ['skale-base-sepolia'])
├─ currency: string (e.g., 'USDC')
├─ paymentAddress: string
└─ products: StoreProduct[]

StoreProduct
├─ storeId: ObjectId → Store
├─ externalId: string (Shopify product ID)
├─ title: string
├─ price: string
├─ imageUrl: string
├─ inventory: number
└─ shopifyData: any

Order
├─ storeId: ObjectId → Store
├─ items: { productId, quantity, price }[]
├─ amounts: { subtotal, tax, shipping, total }
├─ paymentProof: { txHash, network, chainId }
├─ shopifyOrderId: string
├─ status: 'pending' | 'paid' | 'fulfilled'
└─ createdAt: Date

AccessLog (Analytics)
├─ resourceId: ObjectId → Resource
├─ buyerAddress: string
├─ txHash: string
├─ amountPaid: string
└─ accessedAt: Date
```

---

### 2. Frontend (packages/frontend)

**Technology:**
- Next.js 16 (App Router, React Server Components)
- React 19 (with concurrent features)
- Tailwind CSS 4 (JIT compilation)
- RainbowKit 2.2 + wagmi 2.16 (Web3 wallet)

**Architecture:**

```
app/
├── (public)/               # Public routes (no auth)
│   ├── [username]/         # Creator profiles
│   ├── explore/            # Browse marketplace
│   └── faucet/             # Token faucet
│
├── dashboard/              # Protected routes (auth required)
│   ├── page.tsx            # Overview
│   ├── resources/          # Manage resources
│   │   ├── page.tsx        # List
│   │   └── new/            # Create
│   ├── stores/             # Manage Shopify stores
│   ├── shopify/
│   │   └── products/       # Product catalog
│   └── settings/           # Profile settings
│
├── api/                    # API routes (Next.js)
│   └── proxy/              # Proxy to backend
│
├── layout.tsx              # Root layout
└── globals.css             # Global styles

components/
├── providers/              # Context providers
│   ├── auth-provider-inner.tsx
│   ├── ethereum-wallet-provider-inner.tsx
│   └── wagmi-provider.tsx
│
├── wallet-connect.tsx      # RainbowKit integration
├── purchase-modal.tsx      # x402 payment flow
├── network-switcher.tsx    # Chain switching
└── public-navbar.tsx       # Navigation

hooks/
└── use-x402-payment.ts     # x402 payment hook
```

**Key Patterns:**

#### Wallet Authentication
```typescript
// components/providers/auth-provider-inner.tsx
export function AuthProviderInner({ children }) {
  const { address, signMessage } = useAccount();
  const [user, setUser] = useState<User | null>(null);

  async function login() {
    // 1. Get nonce from backend
    const { nonce } = await fetch('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ walletAddress: address })
    }).then(r => r.json());

    // 2. Sign message (SIWE pattern)
    const message = `Sign this message to authenticate: ${nonce}`;
    const signature = await signMessage({ message });

    // 3. Verify signature and get JWT
    const { token, user } = await fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress: address,
        signature,
        message
      })
    }).then(r => r.json());

    // 4. Store token
    localStorage.setItem('authToken', token);
    setUser(user);
  }

  return (
    <AuthContext.Provider value={{ user, login }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### x402 Payment Flow
```typescript
// hooks/use-x402-payment.ts
export function useX402Payment() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  async function purchaseResource(resourceId: string) {
    // 1. Get payment requirements
    const response = await fetch(`/x402/resource/${resourceId}`);

    if (response.status !== 402) {
      throw new Error('Expected 402 Payment Required');
    }

    const { requirements } = await response.json();

    // 2. Execute USDC transfer
    const hash = await writeContract({
      address: requirements.token,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [requirements.recipient, BigInt(requirements.amount)],
      chainId: requirements.chainId
    });

    // 3. Wait for confirmation
    await waitForTransaction({ hash });

    // 4. Submit payment proof
    const result = await fetch(`/x402/resource/${resourceId}?txHash=${hash}`);
    const resource = await result.json();

    return resource;
  }

  return { purchaseResource };
}
```

#### Multi-Chain Support
```typescript
// lib/wagmi-config.ts
import { createConfig, http } from 'wagmi';
import { skaleNebula, baseSepolia } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [skaleNebula, baseSepolia],
  transports: {
    [skaleNebula.id]: http(process.env.NEXT_PUBLIC_SKALE_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL)
  },
  // ... RainbowKit config
});

// components/network-switcher.tsx
export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  return (
    <select
      value={chain?.id}
      onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
    >
      <option value={324705682}>SKALE (Payments)</option>
      <option value={84532}>Base Sepolia (Identity)</option>
    </select>
  );
}
```

---

### 3. x402 SDK (packages/x402-sdk-eth)

**Purpose:** Reusable TypeScript library for x402 payment flows

**Architecture:**

```typescript
// Core abstractions

// Client-side: For agents making purchases
export class X402Client {
  constructor(config: { chain: string; privateKey?: string });

  async purchaseResource(resourceId: string): Promise<Resource>;
  async purchaseProduct(productId: string, quantity: number): Promise<Order>;
  async verifyPayment(txHash: string): Promise<boolean>;
}

// Server-side: For merchants requiring payment
export class X402Server {
  constructor(config: {
    createPaymentRequirements: (req) => PaymentRequirement[];
    fulfillResource: (req, res) => Promise<any>;
  });

  middleware(): ExpressMiddleware;
}

// Multi-chain utilities
export const chains = {
  'skale-base-sepolia': {
    id: 324705682,
    rpcUrl: 'https://testnet.skalenodes.com/v1/...',
    tokens: {
      USDC: '0xa059e27967e5a573a14a62c706ebd1be75333f9a'
    }
  },
  'base-sepolia': {
    id: 84532,
    rpcUrl: 'https://sepolia.base.org',
    tokens: {
      USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
    }
  }
  // ... 8 more chains
};

// Token helpers
export function resolveToken(
  chain: string,
  currency: string
): { address: string; decimals: number } {
  const chainConfig = chains[chain];
  const tokenAddress = chainConfig.tokens[currency];

  return {
    address: tokenAddress,
    decimals: currency === 'DAI' ? 18 : 6 // USDC/USDT = 6, DAI = 18
  };
}

// Payment verification
export async function verifyPayment(
  txHash: string,
  expected: PaymentRequirement
): Promise<boolean> {
  const client = createPublicClient({
    chain: getChain(expected.network),
    transport: http()
  });

  const receipt = await client.getTransactionReceipt({ hash: txHash });

  // Parse Transfer event from ERC20
  const transferLog = receipt.logs.find(log =>
    log.topics[0] === keccak256('Transfer(address,address,uint256)')
  );

  const [from, to, amount] = decodeEventLog({
    abi: ERC20_ABI,
    data: transferLog.data,
    topics: transferLog.topics
  });

  return (
    receipt.status === 'success' &&
    to.toLowerCase() === expected.recipient.toLowerCase() &&
    amount >= BigInt(expected.amount)
  );
}
```

**Build System:**
- **tsup** for dual ESM/CJS builds
- Tree-shakable exports
- Type declarations included
- Source maps for debugging

---

### 4. AI Agent (packages/ai-agent)

**Technology:**
- Vercel AI SDK 4.1
- Anthropic SDK (Claude)
- OpenAI SDK (GPT)
- Google Generative AI SDK (Gemini)

**Architecture:**

```typescript
// Core agent loop
export async function runAgent(userMessage: string) {
  const config = loadConfig();
  const model = getModel(config.llmProvider); // claude-opus-4-6

  const tools = buildToolset(); // 13 tools

  const result = await generateText({
    model,
    tools,
    maxSteps: 15,
    prompt: buildSystemPrompt() + userMessage,

    // Tool execution with approval gates
    onToolCall: async (toolCall) => {
      if (toolCall.name === 'make_onchain_payment') {
        const approved = await requestApproval(toolCall.args);
        if (!approved) {
          throw new Error('Payment rejected by user');
        }
      }

      return await executeToolSecure(toolCall);
    }
  });

  return result;
}

// Tool definitions with Zod schemas
const tools = {
  discover_merchant: tool({
    description: 'Fetch AgentCard from merchant to see capabilities',
    parameters: z.object({
      url: z.string().url()
    }),
    execute: async ({ url }) => {
      const response = await fetch(`${url}/.well-known/agent.json`);
      const card: AgentCard = await response.json();
      return card;
    }
  }),

  check_reputation: tool({
    description: 'Check merchant on-chain reputation via ERC-8004',
    parameters: z.object({
      agentId: z.number().int().positive()
    }),
    execute: async ({ agentId }) => {
      const summary = await erc8004.getReputationSummary(agentId);

      return {
        agentId,
        averageRating: summary.averageRating.toFixed(1),
        totalReviews: summary.totalFeedback.toString(),
        totalClients: summary.totalClients.toString(),
        recommendation: summary.averageRating >= 4.5 ? 'highly_trusted' :
                       summary.averageRating >= 4.0 ? 'trusted' :
                       summary.averageRating >= 3.0 ? 'moderate' : 'caution'
      };
    }
  }),

  make_onchain_payment: tool({
    description: 'Execute on-chain USDC payment to recipient',
    parameters: z.object({
      recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      amount: z.string(),
      network: z.enum(['skale-base-sepolia', 'base-sepolia', ...]),
      memo: z.string().optional()
    }),
    execute: async (params) => {
      // This requires user approval (handled in onToolCall)
      const wallet = getWallet();
      const client = getWalletClient(params.network);

      const { address: tokenAddress, decimals } = resolveToken(
        params.network,
        'USDC'
      );

      const amountWei = parseUnits(params.amount, decimals);

      // Execute transfer
      const hash = await client.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [params.recipient, amountWei]
      });

      // Wait for confirmation
      const receipt = await client.waitForTransactionReceipt({ hash });

      return {
        txHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString()
      };
    }
  })
};
```

**Decision Making:**
```typescript
// Agent reasoning example (from system prompt)
const systemPrompt = `
You are Superio, an autonomous shopping agent. Your goal is to help users
purchase products and access resources using cryptocurrency payments.

Before making ANY purchase:
1. Check merchant reputation via ERC-8004 (aim for 4.0+ stars)
2. Compare prices if multiple options exist
3. Verify you're under budget constraints
4. Request user approval for payments (unless auto-approve enabled)

When evaluating products/resources:
- Consider both price AND reputation (not just cheapest)
- A 4.8★ $5 resource is better than a 3.2★ $3 resource
- Prioritize merchants with 50+ reviews (more reliable)

After purchase:
- Always leave honest feedback (1-5 stars)
- Rate based on: speed, quality, accuracy, value
- Leave constructive comments for other agents

Budget awareness:
- User's max spend: {config.maxSpend}
- Current purchase: {amount}
- Remaining budget: {config.maxSpend - totalSpent}
`;
```

---

### 5. MCP Server (packages/mcp-client)

**Purpose:** Standalone Model Context Protocol server for Claude Desktop

**Implementation:**

```typescript
// src/index.ts
import { createMCPServer } from '@modelcontextprotocol/sdk';

const server = createMCPServer({
  name: 'x402-shopping-agent',
  version: '1.0.0',

  tools: [
    {
      name: 'list_stores',
      description: 'Browse available Shopify stores',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 }
        }
      }
    },
    // ... 29 more tools
  ],

  async execute(toolName, args) {
    // Forward to backend MCP endpoint
    const response = await fetch('http://localhost:3001/mcp/universal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, params: args })
    });

    return await response.json();
  }
});

server.listen();
```

**Claude Desktop Configuration:**

```json
{
  "mcpServers": {
    "x402-shopping": {
      "command": "node",
      "args": ["/path/to/packages/mcp-client/dist/index.js"],
      "env": {
        "BACKEND_URL": "http://localhost:3001"
      }
    }
  }
}
```

---

## 🔐 Security Architecture

### 1. Authentication & Authorization

**Wallet-Based Auth (SIWE Pattern):**
```typescript
// Backend verification
async function verifySignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  const recovered = verifyMessage({
    address: walletAddress as `0x${string}`,
    message,
    signature: signature as `0x${string}`
  });

  return recovered.toLowerCase() === walletAddress.toLowerCase();
}

// JWT generation
function generateToken(walletAddress: string): string {
  return jwt.sign(
    { walletAddress },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 2. Payment Security

**On-Chain Verification:**
```typescript
// Never trust client-provided payment amounts
// Always verify on-chain
async function verifyPaymentSecure(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: bigint
): Promise<boolean> {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  // Check 1: Transaction succeeded
  if (receipt.status !== 'success') return false;

  // Check 2: Sufficient confirmations
  const currentBlock = await publicClient.getBlockNumber();
  if (currentBlock - receipt.blockNumber < 12) return false;

  // Check 3: Parse Transfer event
  const transferLog = receipt.logs.find(log =>
    log.topics[0] === TRANSFER_EVENT_SIGNATURE
  );

  if (!transferLog) return false;

  const { to, value } = decodeEventLog({
    abi: ERC20_ABI,
    data: transferLog.data,
    topics: transferLog.topics
  });

  // Check 4: Correct recipient
  if (to.toLowerCase() !== expectedRecipient.toLowerCase()) return false;

  // Check 5: Sufficient amount
  if (value < expectedAmount) return false;

  return true;
}
```

### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// API rate limits
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Payment verification rate limit (more strict)
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment verifications per minute
  keyGenerator: (req) => req.body.txHash // Per transaction
});

app.use('/api/', apiLimiter);
app.use('/x402/', paymentLimiter);
```

### 4. Input Validation

```typescript
import { z } from 'zod';

// Zod schemas for all inputs
const CreateResourceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  priceUsdc: z.string().regex(/^\d+(\.\d{1,6})?$/), // Max 6 decimals
  contentType: z.enum(['json', 'text', 'url']),
  content: z.any(),
  paymentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  network: z.enum(['skale-base-sepolia', 'base-sepolia', ...])
});

app.post('/api/resources', requireAuth, async (req, res) => {
  try {
    const validated = CreateResourceSchema.parse(req.body);
    // ... create resource
  } catch (err) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }
});
```

---

## 📊 Data Flow Diagrams

### End-to-End Purchase Flow

```
Agent                 Backend              SKALE           Base           Merchant
  │                      │                   │              │               │
  │  1. Discover         │                   │              │               │
  ├──────────────────────>                   │              │               │
  │  GET /.well-known/   │                   │              │               │
  │      agent.json      │                   │              │               │
  │<──────────────────────                   │              │               │
  │  AgentCard           │                   │              │               │
  │                      │                   │              │               │
  │  2. Check Reputation │                   │              │               │
  ├──────────────────────>                   │              │               │
  │                      │  getReputation()  │              │               │
  │                      ├────────────────────┼──────────────>              │
  │                      │                   │  Read        │               │
  │                      │                   │  Reputation  │               │
  │                      │                   │  Registry    │               │
  │                      │<───────────────────┼──────────────               │
  │<──────────────────────                   │              │               │
  │  4.8★, 127 reviews   │                   │              │               │
  │                      │                   │              │               │
  │  3. Request Resource │                   │              │               │
  ├──────────────────────>                   │              │               │
  │  GET /x402/resource  │                   │              │               │
  │      /:id            │                   │              │               │
  │<──────────────────────                   │              │               │
  │  402 Payment Req     │                   │              │               │
  │  (5.00 USDC)         │                   │              │               │
  │                      │                   │              │               │
  │  4. Execute Payment  │                   │              │               │
  ├────────────────────────────────────────────>             │               │
  │  transfer(merchant,  │                   │              │               │
  │         5.00 USDC)   │                   │              │               │
  │                      │                   │  TX mined    │               │
  │<────────────────────────────────────────────             │               │
  │  txHash              │                   │              │               │
  │                      │                   │              │               │
  │  5. Submit Proof     │                   │              │               │
  ├──────────────────────>                   │              │               │
  │  POST /x402/resource │                   │              │               │
  │      /:id?txHash=0x  │                   │              │               │
  │                      │  6. Verify TX     │              │               │
  │                      ├────────────────────>              │               │
  │                      │  getTransaction   │              │               │
  │                      │  Receipt()        │              │               │
  │                      │<────────────────────              │               │
  │                      │  ✓ Valid          │              │               │
  │                      │                   │              │               │
  │                      │  7. Log Access    │              │               │
  │                      │  (MongoDB)        │              │               │
  │                      │                   │              │               │
  │<──────────────────────                   │              │               │
  │  200 OK              │                   │              │               │
  │  Resource content    │                   │              │               │
  │                      │                   │              │               │
  │  8. Leave Feedback   │                   │              │               │
  ├──────────────────────>                   │              │               │
  │                      │  giveFeedback()   │              │               │
  │                      ├────────────────────┼──────────────>              │
  │                      │                   │  Write to    │               │
  │                      │                   │  Reputation  │               │
  │                      │                   │  Registry    │               │
  │                      │<───────────────────┼──────────────               │
  │<──────────────────────                   │              │               │
  │  ✓ Feedback recorded │                   │              │               │
  │                      │                   │              │               │
```

---

## 🚀 Performance Optimizations

### 1. Caching Strategy

```typescript
// In-memory cache for AgentCards
const agentCardCache = new Map<string, { card: AgentCard; expires: number }>();

export async function getAgentCard(url: string): Promise<AgentCard> {
  const cached = agentCardCache.get(url);

  if (cached && cached.expires > Date.now()) {
    return cached.card;
  }

  const response = await fetch(`${url}/.well-known/agent.json`);
  const card = await response.json();

  agentCardCache.set(url, {
    card,
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  });

  return card;
}
```

### 2. Database Indexing

```typescript
// Mongoose indexes for fast queries
CreatorSchema.index({ walletAddress: 1 }, { unique: true });
CreatorSchema.index({ username: 1 }, { unique: true });

ResourceSchema.index({ creatorId: 1 });
ResourceSchema.index({ priceUsdc: 1 }); // For price sorting
ResourceSchema.index({ createdAt: -1 }); // For recent items

AccessLogSchema.index({ resourceId: 1, accessedAt: -1 }); // Analytics
AccessLogSchema.index({ buyerAddress: 1 }); // User history

StoreProductSchema.index({ storeId: 1 });
StoreProductSchema.index({ externalId: 1 }); // Shopify ID lookup
```

### 3. Pagination

```typescript
// Efficient cursor-based pagination
export async function listResources(params: {
  limit: number;
  cursor?: string; // ObjectId of last item
}) {
  const query = params.cursor
    ? { _id: { $gt: new Types.ObjectId(params.cursor) } }
    : {};

  const resources = await Resource
    .find(query)
    .sort({ _id: 1 })
    .limit(params.limit + 1);

  const hasMore = resources.length > params.limit;
  const items = hasMore ? resources.slice(0, -1) : resources;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]._id.toString() : null
  };
}
```

### 4. Parallel Blockchain Queries

```typescript
// Batch multiple chain reads
export async function getMultipleReputations(agentIds: number[]) {
  const publicClient = getPublicClient();

  // Parallel contract calls
  const results = await Promise.all(
    agentIds.map(id =>
      publicClient.readContract({
        address: REPUTATION_REGISTRY,
        abi: ReputationRegistryABI,
        functionName: 'getReputationSummary',
        args: [BigInt(id)]
      })
    )
  );

  return results.map((r, i) => ({
    agentId: agentIds[i],
    averageRating: Number(r.averageRating) / 100, // Basis points
    totalFeedback: Number(r.totalFeedback),
    totalClients: Number(r.totalClients)
  }));
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// packages/backend/tests/x402/payment-verification.test.ts
describe('Payment Verification', () => {
  it('should verify valid USDC transfer', async () => {
    const txHash = '0x123...'; // Mock transaction
    const expected = {
      recipient: '0xmerchant...',
      amount: parseUnits('5.00', 6),
      token: MUSDC_ADDRESS
    };

    const isValid = await verifyPayment(txHash, expected);
    expect(isValid).toBe(true);
  });

  it('should reject insufficient payment amount', async () => {
    const txHash = '0x123...'; // Paid 3.00 instead of 5.00
    const expected = {
      recipient: '0xmerchant...',
      amount: parseUnits('5.00', 6),
      token: MUSDC_ADDRESS
    };

    const isValid = await verifyPayment(txHash, expected);
    expect(isValid).toBe(false);
  });
});
```

### Integration Tests

```typescript
// packages/backend/tests/a2a/protocol.test.ts
describe('A2A Protocol', () => {
  it('should complete full purchase flow', async () => {
    // 1. Send purchase intent
    const intent = await a2aClient.send({
      method: 'message/send',
      params: {
        action: 'purchase_product',
        input: { productId: '123', quantity: 1 }
      }
    });

    expect(intent.state).toBe('input-required');
    expect(intent.paymentRequirements).toBeDefined();

    // 2. Execute payment
    const tx = await sendUSDC(
      intent.paymentRequirements.recipient,
      intent.paymentRequirements.amount
    );

    // 3. Submit proof
    const result = await a2aClient.send({
      method: 'message/send',
      params: {
        action: 'submit_payment',
        taskId: intent.taskId,
        txHash: tx.hash
      }
    });

    // 4. Poll for completion
    let task;
    for (let i = 0; i < 10; i++) {
      task = await a2aClient.send({
        method: 'tasks/get',
        params: { taskId: intent.taskId }
      });

      if (task.state === 'completed') break;
      await sleep(1000);
    }

    expect(task.state).toBe('completed');
    expect(task.artifacts).toHaveLength(1);
  });
});
```

---

## 🔄 Deployment Architecture

### Development
```bash
./dev.sh
# Starts: backend (3001), payment server (3002), frontend (3000)
# MongoDB: localhost:27017
# All hot-reloading enabled
```

### Production (Railway/Render)

```yaml
# railway.json
services:
  - name: backend
    build:
      dockerfile: Dockerfile.backend
    env:
      NODE_ENV: production
      PORT: 3001
    healthcheck:
      path: /health
      interval: 30s

  - name: frontend
    build:
      dockerfile: Dockerfile.frontend
    env:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.x402.app

  - name: mongodb
    image: mongo:8.0
    volumes:
      - /data/db
```

### Environment Variables

**Backend (.env.production):**
```bash
# Server
NODE_ENV=production
PORT=3001
APP_URL=https://api.x402.app
FRONTEND_URL=https://x402.app

# Database
MONGODB_URI=mongodb+srv://production-cluster

# Blockchain
X402_CHAIN=skale-base-sepolia
SKALE_RPC_URL=https://testnet.skalenodes.com/v1/...
BASE_RPC_URL=https://sepolia.base.org
WALLET_PRIVATE_KEY=0x... # Hot wallet for gas on Base

# ERC-8004
ERC8004_AGENT_ID=1

# Shopify
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...

# Auth
JWT_SECRET=... # 256-bit random string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless backend:** All state in MongoDB or on-chain
- **Load balancing:** Multiple backend instances behind ALB
- **Session affinity:** Not required (JWT-based auth)

### Database Scaling
- **MongoDB Atlas:** M10+ cluster with auto-scaling
- **Read replicas:** For analytics queries
- **Sharding:** By `creatorId` if needed

### Blockchain Scaling
- **Multiple RPC providers:** Automatic failover
- **Request queuing:** Rate limit compliance
- **Caching:** AgentCards, reputation summaries

### Future: BITE v2 Integration
```typescript
// Encrypted conditional payments
import { BITEClient } from '@skale/bite-sdk';

const bite = new BITEClient({
  chain: 'skale-base-sepolia'
});

// Encrypt payment intent
const encrypted = await bite.encryptTransaction({
  to: merchantAddress,
  data: encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipient, amount]
  }),
  conditions: {
    minReputationRating: 4.5,
    maxAge: 3600, // 1 hour TTL
    requiredValidations: ['kyc']
  }
});

// Submit to network
const txHash = await bite.submitEncrypted(encrypted);

// Decryption happens automatically when conditions met
```

---

## 🎯 Future Enhancements

1. **Payment Streaming** - Real-time micropayments for usage-based pricing
2. **Cross-Chain Bridging** - Automatic token bridging via Chainlink CCIP
3. **Escrow Contracts** - Smart contract-based payment holds
4. **Subscription Management** - Recurring payments with agent automation
5. **Multi-Agent Marketplace** - Agent-run autonomous storefronts
6. **Dispute Resolution** - On-chain arbitration via Kleros
7. **Insurance Protocol** - Protection against malicious merchants
8. **Fiat On-Ramps** - Credit card → crypto for agent wallets
9. **Enterprise Features** - Team accounts, role-based access, SOC2
10. **Mobile Apps** - iOS/Android agent management

---

*Technical architecture prepared for San Francisco Agentic Commerce x402 Hackathon*
*February 11-13, 2026*
