"use client";

import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";

export default function ExamplesPage() {
  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col gap-12">
      <section>
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider w-fit">
            <span className="material-symbols-outlined text-xs leading-none">integration_instructions</span>
            Code Examples
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Code Examples
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Complete, working examples you can copy and use in your projects
          </p>
        </div>
      </section>

      <section className="space-y-8">
        {/* Example 1: Basic API */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">1. Basic Payment-Gated API</h2>
          <p className="text-muted-foreground mb-6">
            Simple API that requires $0.10 USDC payment per request
          </p>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Server (server.ts)</h3>
                <CodeBlock code={`import express from 'express';
import { X402Server } from '@super-x402/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY!,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8', // USDC
});

app.get('/api/weather',
  x402.middleware({ price: '0.10' }),
  (req, res) => {
    res.json({
      temperature: 72,
      conditions: 'Sunny',
      humidity: 45,
    });
  }
);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});`} />
              </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Client (client.ts)</h3>
                <CodeBlock code={`import { X402Client } from '@super-x402/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new X402Client({
  network: 'mainnet',
  privateKey: process.env.WALLET_PRIVATE_KEY!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
});

async function getWeather() {
  const response = await client.fetch('http://localhost:3001/api/weather');
  const weather = await response.json();

  console.log('Weather:', weather);
  // Automatically paid 0.10 USDC
}

getWeather();`} />
            </div>
          </div>
        </div>

        {/* Example 2: Dynamic Pricing */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">2. Dynamic Pricing Based on Usage</h2>
          <p className="text-muted-foreground mb-6">
            Charge different prices based on request parameters or user tier
          </p>
          <div>
              <CodeBlock code={`import express from 'express';
import { X402Server } from '@super-x402/sdk';

const app = express();
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY!,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
});

app.get('/api/generate', async (req, res, next) => {
  const model = req.query.model as string;

  // Different prices for different models
  const pricing = {
    'gpt-4': '1.00',
    'gpt-3.5': '0.10',
    'claude-3': '0.50',
  };

  const price = pricing[model] || '0.10';

  await x402.middleware({
    price,
    metadata: { model }
  })(req, res, next);
}, (req, res) => {
  const model = req.query.model as string;
  res.json({
    model,
    response: \`Generated content using \${model}\`,
  });
});

app.listen(3001);`} />
          </div>
        </div>

        {/* Example 3: File Download */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">3. Pay-Per-Download Files</h2>
          <p className="text-muted-foreground mb-6">
            Sell digital files like PDFs, datasets, or software
          </p>
          <div>
              <CodeBlock code={`import express from 'express';
import { X402Server } from '@super-x402/sdk';
import fs from 'fs';
import path from 'path';

const app = express();
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY!,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
});

const files = {
  'premium-ebook': { price: '5.00', path: './files/ebook.pdf' },
  'dataset': { price: '10.00', path: './files/dataset.csv' },
  'template': { price: '2.50', path: './files/template.zip' },
};

app.get('/download/:fileId',
  async (req, res, next) => {
    const file = files[req.params.fileId];
    if (!file) return res.status(404).json({ error: 'File not found' });

    await x402.middleware({
      price: file.price,
      metadata: { fileId: req.params.fileId }
    })(req, res, next);
  },
  (req, res) => {
    const file = files[req.params.fileId];
    const filePath = path.resolve(file.path);

    res.download(filePath);
  }
);

app.listen(3001);`} />
          </div>
        </div>

        {/* Example 4: API with Rate Limiting */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">4. API with Usage Tracking</h2>
          <p className="text-muted-foreground mb-6">
            Track usage and store payment history in database
          </p>
          <div>
              <CodeBlock code={`import express from 'express';
import { X402Server } from '@super-x402/sdk';
import { MongoClient } from 'mongodb';

const app = express();
const mongo = await MongoClient.connect(process.env.MONGODB_URI!);
const db = mongo.db('x402');

const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY!,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
});

app.get('/api/translate',
  x402.middleware({
    price: '0.25',
    onPaymentVerified: async (payment) => {
      // Save to database
      await db.collection('payments').insertOne({
        txHash: payment.txHash,
        from: payment.from,
        amount: payment.amount,
        resource: 'translate',
        timestamp: new Date(),
      });

      // Update usage stats
      await db.collection('usage').updateOne(
        { address: payment.from },
        {
          $inc: { requests: 1, totalSpent: parseFloat(payment.amount) },
          $set: { lastUsed: new Date() }
        },
        { upsert: true }
      );
    }
  }),
  (req, res) => {
    const { text, from, to } = req.query;

    // Your translation logic
    const translated = translateText(text, from, to);

    res.json({ translated });
  }
);

app.listen(3001);`} />
          </div>
        </div>

        {/* Example 5: Batch Operations */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">5. Batch Processing with Credits</h2>
          <p className="text-muted-foreground mb-6">
            Purchase credits upfront, use them for multiple requests
          </p>
          <div>
              <CodeBlock code={`import express from 'express';
import { X402Server } from '@super-x402/sdk';

const app = express();
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY!,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS!,
  tokenAddress: '0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8',
});

// In-memory credits store (use Redis/DB in production)
const credits = new Map<string, number>();

// Buy credits
app.post('/credits/buy',
  x402.middleware({
    price: '10.00', // $10 for 100 credits
    onPaymentVerified: async (payment) => {
      const current = credits.get(payment.from) || 0;
      credits.set(payment.from, current + 100);
    }
  }),
  (req, res) => {
    const address = req.headers['x-payment-from'] as string;
    res.json({
      credits: credits.get(address),
      message: 'Credits purchased successfully'
    });
  }
);

// Use credits for API calls
app.get('/api/process', (req, res) => {
  const address = req.headers['x-wallet-address'] as string;
  const userCredits = credits.get(address) || 0;

  if (userCredits < 1) {
    return res.status(402).json({
      error: 'Insufficient credits',
      credits: userCredits,
    });
  }

  // Deduct credit
  credits.set(address, userCredits - 1);

  res.json({
    result: 'Processed',
    creditsRemaining: userCredits - 1,
  });
});

app.listen(3001);`} />
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-4">More Examples</h2>
          <p className="text-muted-foreground mb-6">
            Want to see more examples? Check out our AI agent integration and Shopify guides
          </p>
          <div className="flex gap-4">
            <Link href="/docs/ai-agents" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors">
              AI Agent Examples
            </Link>
            <Link href="/docs/shopify" className="px-6 py-2.5 border border-border rounded-xl font-bold hover:bg-muted transition-colors">
              Shopify Integration
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
