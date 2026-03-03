"use client";

import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";

export default function AIAgentsPage() {
  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col gap-12">
      <section>
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit">
            <span className="material-symbols-outlined text-xs leading-none">smart_toy</span>
            AI Agents
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            AI Agent Payments
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Enable AI agents to autonomously discover, pay for, and consume your APIs and content
          </p>
        </div>
      </section>

      <section className="space-y-8">
        {/* Overview */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">Why AI Agent Payments?</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              AI agents are the future of digital commerce. Unlike humans, they:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Can't fill out credit card forms or sign up for accounts</li>
              <li>Need instant, programmatic payment methods</li>
              <li>Require machine-readable pricing and payment protocols</li>
              <li>Operate autonomously 24/7 without human intervention</li>
            </ul>
            <p className="pt-4">
              <strong className="text-foreground">x402 solves this</strong> by providing HTTP 402-based payments that agents can understand and execute automatically.
            </p>
          </div>
        </div>

        {/* MCP Setup */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Model Context Protocol (MCP) Setup</h2>
          <p className="text-muted-foreground mb-6">
            Enable Claude Desktop to discover and purchase from x402
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">1. Install MCP Client</h3>
              <CodeBlock code={`cd packages/mcp-client
pnpm install`} language="bash" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">2. Configure Claude Desktop</h3>
              <p className="text-muted-foreground mb-3">
                  Edit <code className="bg-muted px-2 py-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or <code className="bg-muted px-2 py-1 rounded">%APPDATA%\Claude\claude_desktop_config.json</code> (Windows):
                </p>
                <CodeBlock code={`{
  "mcpServers": {
    "x402": {
      "command": "node",
      "args": [
        "/path/to/USDC/packages/mcp-client/superpage-x402.js"
      ],
      "env": {
        "SUPERPAGE_SERVER": "http://localhost:3001",
        "WALLET_PRIVATE_KEY": "0xYourPrivateKey",
        "ETH_NETWORK": "mainnet",
        "MAX_AUTO_PAYMENT": "10.00"
      }
    }
  }
}`} language="json" />
              </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">3. Restart Claude Desktop</h3>
              <p className="text-muted-foreground">
                Quit and restart Claude Desktop. You should see the MCP tools available in the chat.
              </p>
            </div>
          </div>
        </div>

        {/* Available Tools */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Available MCP Tools</h2>
          <div>
            <div className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_wallet</h4>
                <p className="text-muted-foreground mb-2">Check ETH and USDC token balance</p>
                  <CodeBlock code={`Example prompt: "Check my x402 wallet balance"`} language="text" />
                </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_list_stores</h4>
                <p className="text-muted-foreground mb-2">Browse available Shopify stores</p>
                <CodeBlock code={`Example prompt: "Show me stores on x402"`} language="text" />
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_browse_products</h4>
                <p className="text-muted-foreground mb-2">View products in a specific store</p>
                <CodeBlock code={`Example prompt: "Browse products in store shopify/yf8vem-uw"`} language="text" />
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_buy</h4>
                <p className="text-muted-foreground mb-2">Purchase a product with USDC</p>
                <CodeBlock code={`Example prompt: "Buy the Example Perfume for test@example.com, ship to John Doe, 123 Main St, NYC, NY 10001, US"`} language="text" />
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_list_resources</h4>
                <p className="text-muted-foreground mb-2">Find APIs, files, and articles</p>
                <CodeBlock code={`Example prompt: "List available resources on x402"`} language="text" />
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_request</h4>
                <p className="text-muted-foreground mb-2">Access paid content (auto-pays if needed)</p>
                <CodeBlock code={`Example prompt: "Access the article 'look-at-the-bright-side' on x402"`} language="text" />
              </div>

              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-bold text-foreground mb-2 font-mono">x402_discover</h4>
                <p className="text-muted-foreground mb-2">Check if a URL supports x402 payments</p>
                <CodeBlock code={`Example prompt: "Does https://example.com/api support x402?"`} language="text" />
              </div>
            </div>
          </div>
        </div>

        {/* Building Your Own Agent */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Building Your Own AI Agent</h2>
          <p className="text-muted-foreground mb-6">
            Create custom agents that can pay for services
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Agent with Auto-Payment</h3>
                <CodeBlock code={`import { X402Client } from '@super-x402/sdk';

class AIAgent {
  private x402: X402Client;

  constructor(privateKey: string) {
    this.x402 = new X402Client({
      network: 'mainnet',
      privateKey,
      tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
      maxAutoPayment: '5.00', // Don't pay more than $5 automatically
    });
  }

  async discoverAPIs() {
    // Find available APIs
    const response = await fetch('http://localhost:3001/x402/resources');
    const resources = await response.json();
    return resources.filter(r => r.type === 'API');
  }

  async callAPI(url: string, params: any) {
    try {
      // Automatically pays if 402 is returned
      const response = await this.x402.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  async run() {
    // 1. Discover available APIs
    const apis = await this.discoverAPIs();
    console.log('Found APIs:', apis.length);

    // 2. Select the one you need
    const weatherAPI = apis.find(a => a.title.includes('Weather'));
    if (!weatherAPI) return;

    // 3. Call it (auto-pays if needed)
    const weather = await this.callAPI(weatherAPI.url, {
      city: 'New York'
    });

    console.log('Weather:', weather);
  }
}

// Usage
const agent = new AIAgent(process.env.WALLET_PRIVATE_KEY!);
await agent.run();`} />
            </div>
          </div>
        </div>

        {/* Agent Shopping Example */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Shopping Agent Example</h2>
          <p className="text-muted-foreground mb-6">
            Agent that can browse stores and make purchases
          </p>
          <div>
              <CodeBlock code={`import { X402Client } from '@super-x402/sdk';

class ShoppingAgent {
  private x402: X402Client;
  private apiUrl = 'http://localhost:3001';

  constructor(privateKey: string) {
    this.x402 = new X402Client({
      network: 'mainnet',
      privateKey,
      tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
    });
  }

  async findStores() {
    const response = await fetch(\`\${this.apiUrl}/x402/stores\`);
    return await response.json();
  }

  async browseProducts(storeId: string) {
    const response = await fetch(\`\${this.apiUrl}/x402/stores/\${storeId}/products\`);
    return await response.json();
  }

  async buyProduct(storeId: string, productId: string, customerInfo: any) {
    const url = \`\${this.apiUrl}/x402/eth/store/\${storeId}/product/\${productId}\`;

    // Make purchase (auto-pays with USDC)
    const response = await this.x402.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerInfo),
    });

    return await response.json();
  }

  async shop(productName: string) {
    // 1. Find stores
    const stores = await this.findStores();
    console.log(\`Found \${stores.length} stores\`);

    // 2. Search for product across all stores
    for (const store of stores) {
      const products = await this.browseProducts(store._id);
      const product = products.find(p =>
        p.title.toLowerCase().includes(productName.toLowerCase())
      );

      if (product) {
        console.log(\`Found "\${product.title}" for \$\${product.price}\`);

        // 3. Make purchase
        const order = await this.buyProduct(
          store._id,
          product.shopifyProductId,
          {
            email: 'agent@example.com',
            shipping: {
              firstName: 'AI',
              lastName: 'Agent',
              address1: '123 Bot Street',
              city: 'San Francisco',
              province: 'CA',
              zip: '94102',
              country: 'US',
            }
          }
        );

        console.log('Order placed:', order.orderId);
        return order;
      }
    }

    console.log('Product not found');
  }
}

// Usage
const agent = new ShoppingAgent(process.env.WALLET_PRIVATE_KEY!);
await agent.shop('perfume');`} />
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Security Best Practices</h2>
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Set Maximum Auto-Payment</p>
                <p>Always configure <code className="bg-muted px-2 py-1 rounded text-primary">maxAutoPayment</code> to prevent agents from spending too much</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Use Dedicated Wallets</p>
                <p>Create separate wallets for agents with limited funds</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Monitor Transactions</p>
                <p>Log all payments and set up alerts for unusual activity</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Verify Payment Requirements</p>
                <p>Check the payment amount before proceeding with high-value transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-4">Ready to Build AI Agents?</h2>
          <p className="text-muted-foreground mb-6">
            Check out the MCP server documentation and SDK reference for more details
          </p>
          <div className="flex gap-4">
            <Link href="/docs/mcp" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
              MCP Server Docs
            </Link>
            <Link href="/docs/sdk" className="px-6 py-2.5 border border-border rounded-xl font-bold text-foreground hover:bg-muted transition-colors">
              SDK Reference
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
