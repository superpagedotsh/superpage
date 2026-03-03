"use client";

import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";

export default function SDKDocsPage() {
  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col gap-12">
      <section>
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit">
            <span className="material-symbols-outlined text-xs leading-none">code</span>
            SDK Reference
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            @super-x402/sdk
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            TypeScript SDK for building HTTP 402 payment-gated APIs and applications on Ethereum
          </p>
        </div>
      </section>

      <section className="space-y-8">
        {/* Installation */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Installation</h2>
          <p className="text-muted-foreground mb-4">
            Install the SDK via npm, pnpm, or yarn
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2 font-medium">npm</p>
              <CodeBlock code="npm install @super-x402/sdk viem" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2 font-medium">pnpm</p>
              <CodeBlock code="pnpm add @super-x402/sdk viem" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2 font-medium">yarn</p>
              <CodeBlock code="yarn add @super-x402/sdk viem" />
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Quick Start</h2>
          <p className="text-muted-foreground mb-6">
            Get up and running in 5 minutes
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Server-Side (Express)</h3>
                <CodeBlock code={`import express from 'express';
import { X402Server } from '@super-x402/sdk';

const app = express();
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8', // USDC
});

// Protected endpoint requiring 1.00 USDC payment
app.get('/api/premium-data',
  x402.middleware({ price: '1.00' }),
  (req, res) => {
    res.json({
      message: 'This is premium data!',
      data: { /* your data */ }
    });
  }
);

app.listen(3001);`} />
              </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Client-Side</h3>
                <CodeBlock code={`import { X402Client } from '@super-x402/sdk';

const client = new X402Client({
  network: 'mainnet',
  privateKey: process.env.WALLET_PRIVATE_KEY,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8', // USDC
});

// Automatically pays if 402 is returned
const response = await client.fetch('https://api.example.com/premium-data');
const data = await response.json();

console.log(data);`} />
            </div>
          </div>
        </div>

        {/* Server API */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">X402Server API</h2>
          <p className="text-muted-foreground mb-6">
            Server-side payment verification and middleware
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Constructor</h3>
              <CodeBlock code={`const x402 = new X402Server({
  network: 'mainnet' | 'sepolia',
  privateKey: string,              // Your private key
  recipientAddress: string,        // Address to receive payments
  tokenAddress: string,            // USDC token address
  rpcUrl?: string,                 // Optional custom RPC
});`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Middleware Method</h3>
              <CodeBlock code={`app.get('/api/resource',
  x402.middleware({
    price: '1.00',                 // Price in USDC (e.g., "1.00" = $1.00)
    metadata?: {                   // Optional metadata
      resourceId: 'xyz',
      description: 'Premium data access'
    }
  }),
  (req, res) => {
    // Payment verified, serve content
    res.json({ data: 'protected content' });
  }
);`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Verify Payment Method</h3>
              <CodeBlock code={`const result = await x402.verifyPayment({
  txHash: '0xabc123...',           // Transaction hash
  expectedAmount: '1000000',       // Amount in token decimals (1.00 USDC = 1000000)
  expectedRecipient: '0x...',      // Your recipient address
});

if (result.verified) {
  console.log('Payment verified!');
  console.log('From:', result.from);
  console.log('Amount:', result.amount);
}`} />
            </div>
          </div>
        </div>

        {/* Client API */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">X402Client API</h2>
          <p className="text-muted-foreground mb-6">
            Client-side automatic payment handling
          </p>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Constructor</h3>
              <CodeBlock code={`const client = new X402Client({
  network: 'mainnet' | 'sepolia',
  privateKey: string,              // Your wallet private key
  tokenAddress: string,            // USDC token address
  rpcUrl?: string,                 // Optional custom RPC
  maxAutoPayment?: string,         // Max auto-payment (default: "10.00")
});`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Fetch Method</h3>
              <CodeBlock code={`// Automatically handles 402 responses and makes payment
const response = await client.fetch(
  'https://api.example.com/resource',
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
);

const data = await response.json();`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Manual Payment</h3>
              <CodeBlock code={`const txHash = await client.pay({
  to: '0x...',                     // Recipient address
  amount: '1.00',                  // Amount in USDC
});

console.log('Payment sent:', txHash);`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Check Balance</h3>
              <CodeBlock code={`const balance = await client.getBalance();
console.log('USDC Balance:', balance.formatted);
console.log('ETH Balance:', balance.eth);`} />
            </div>
          </div>
        </div>

        {/* Advanced Usage */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Advanced Usage</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Custom Token Support</h3>
              <CodeBlock code={`// Use any ERC-20 token
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS,
  tokenAddress: '0xYourTokenAddress',
});`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Dynamic Pricing</h3>
              <CodeBlock code={`app.get('/api/dynamic',
  async (req, res, next) => {
    // Calculate price based on user, usage, etc.
    const price = calculatePrice(req.user);

    await x402.middleware({ price })(req, res, next);
  },
  (req, res) => {
    res.json({ data: 'content' });
  }
);`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Payment Callbacks</h3>
              <CodeBlock code={`app.get('/api/resource',
  x402.middleware({
    price: '1.00',
    onPaymentVerified: async (payment) => {
      // Log to database
      await db.orders.create({
        txHash: payment.txHash,
        from: payment.from,
        amount: payment.amount,
      });
    }
  }),
  (req, res) => {
    res.json({ data: 'content' });
  }
);`} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Error Handling</h3>
              <CodeBlock code={`try {
  const response = await client.fetch('https://api.example.com/resource');
  const data = await response.json();
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough USDC tokens');
  } else if (error.code === 'PAYMENT_REQUIRED') {
    console.error('Payment required but auto-pay disabled');
  } else if (error.code === 'PAYMENT_FAILED') {
    console.error('Payment transaction failed');
  }
}`} />
            </div>
          </div>
        </div>

        {/* TypeScript Types */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">TypeScript Types</h2>
          <div className="space-y-4">
            <CodeBlock code={`// Configuration types
interface X402ServerConfig {
  network: 'mainnet' | 'sepolia';
  privateKey: string;
  recipientAddress: string;
  tokenAddress: string;
  rpcUrl?: string;
}

interface X402ClientConfig {
  network: 'mainnet' | 'sepolia';
  privateKey: string;
  tokenAddress: string;
  rpcUrl?: string;
  maxAutoPayment?: string;
}

// Middleware options
interface MiddlewareOptions {
  price: string;
  metadata?: Record<string, any>;
  onPaymentVerified?: (payment: PaymentVerification) => Promise<void>;
}

// Payment verification result
interface PaymentVerification {
  verified: boolean;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: number;
}

// Balance information
interface BalanceInfo {
  raw: bigint;
  formatted: string;
  eth: string;
}`} />
          </div>
        </div>

        {/* Examples Link */}
        <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-4">Ready to Build?</h2>
          <p className="text-muted-foreground mb-6">
            Check out complete examples and integration guides
          </p>
          <div className="flex gap-4">
            <Link href="/docs/examples" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
              View Examples
            </Link>
            <Link href="/docs/api" className="px-6 py-2.5 border border-border rounded-xl font-bold hover:bg-muted transition-colors">
              REST API Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
