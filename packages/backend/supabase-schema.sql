-- ==============================================
-- x402 Shopify Commerce - Supabase Schema
-- ==============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com → Your Project → SQL Editor → New Query
-- ==============================================

-- 1. STORES TABLE
-- Stores Shopify store configurations
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  shop_domain TEXT,
  admin_access_token TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'USD',
  networks TEXT[] DEFAULT ARRAY['solana-devnet'],
  asset TEXT DEFAULT 'USDC',
  agent_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STORE PRODUCTS TABLE
-- Product catalog synced from Shopify
CREATE TABLE IF NOT EXISTS store_products (
  id SERIAL PRIMARY KEY,
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  price TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  inventory INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, variant_id)
);

-- 3. ORDER INTENTS TABLE
-- Pending payment intents (HTTP 402 flow)
CREATE TABLE IF NOT EXISTS order_intents (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  email TEXT NOT NULL,
  subtotal_amount TEXT NOT NULL,
  shipping_amount TEXT DEFAULT '0',
  tax_amount TEXT DEFAULT '0',
  total_amount TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  body_hash TEXT,
  x402_requirements JSONB,
  verified_at TIMESTAMPTZ,
  verification_status TEXT,
  payment_tx_hash TEXT,
  payment_header_b64 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE
-- Confirmed orders linked to Shopify
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
  order_intent_id TEXT REFERENCES order_intents(id),
  email TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal_amount TEXT NOT NULL,
  shipping_amount TEXT DEFAULT '0',
  tax_amount TEXT DEFAULT '0',
  total_amount TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'fulfilled', 'cancelled', 'refunded')),
  shopify_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES (for better query performance)
-- ==============================================

-- Store products by store
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_variant_id ON store_products(variant_id);

-- Order intents by store and status
CREATE INDEX IF NOT EXISTS idx_order_intents_store_id ON order_intents(store_id);
CREATE INDEX IF NOT EXISTS idx_order_intents_status ON order_intents(status);
CREATE INDEX IF NOT EXISTS idx_order_intents_expires_at ON order_intents(expires_at);

-- Orders by store
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_shopify_order_id ON orders(shopify_order_id);

-- ==============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ==============================================
-- Uncomment if you want to enable RLS

-- ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE order_intents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- HELPER FUNCTION: Auto-expire order intents
-- ==============================================
-- This function can be called periodically to mark expired intents

CREATE OR REPLACE FUNCTION expire_old_order_intents()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE order_intents
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON store_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- x402 EVERYTHING - Universal Monetization
-- ==============================================

-- 5. CREATORS TABLE
-- Wallet-authenticated content creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RESOURCES TABLE
-- Paywalled content/APIs/files
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  slug TEXT UNIQUE, -- human-readable URL slug
  type TEXT NOT NULL CHECK (type IN ('api', 'file', 'article', 'shopify')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing in USDC
  price_usdc DECIMAL(10,6) NOT NULL DEFAULT 0.01,
  
  -- Type-specific configuration (JSONB)
  -- For 'api': { "upstream_url": "https://...", "method": "GET|POST", "headers": {} }
  -- For 'file': { "storage_key": "files/abc123.pdf", "mime_type": "application/pdf", "filename": "doc.pdf", "size_bytes": 1234 }
  -- For 'article': { "content": "markdown content" } or { "storage_key": "articles/abc.md" }
  -- For 'shopify': { "store_id": "store_xxx" } - links to existing stores table
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- show in public listings
  access_count INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,6) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACCESS LOGS TABLE
-- Payment and access tracking for analytics
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  
  -- Payment details
  payment_signature TEXT NOT NULL,
  amount_usdc DECIMAL(10,6) NOT NULL,
  network TEXT DEFAULT 'devnet',
  
  -- Consumer info
  consumer_wallet TEXT,
  consumer_ip TEXT,
  user_agent TEXT,
  
  -- Timestamps
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUTH NONCES TABLE
-- For Sign-in-with-Solana challenge/response
CREATE TABLE IF NOT EXISTS auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES for x402 Everything
-- ==============================================

-- Creators
CREATE INDEX IF NOT EXISTS idx_creators_wallet ON creators(wallet_address);

-- Resources
CREATE INDEX IF NOT EXISTS idx_resources_creator_id ON resources(creator_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);

-- Access logs
CREATE INDEX IF NOT EXISTS idx_access_logs_resource_id ON access_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_creator_id ON access_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_consumer_wallet ON access_logs(consumer_wallet);

-- Auth nonces
CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet ON auth_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires ON auth_nonces(expires_at);

-- ==============================================
-- TRIGGERS for x402 Everything
-- ==============================================

-- Auto-update updated_at for creators
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for resources
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Clean up expired nonces
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_nonces
  WHERE expires_at < NOW() OR used = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update resource stats after access
CREATE OR REPLACE FUNCTION update_resource_stats(
  p_resource_id UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE resources
  SET 
    access_count = access_count + 1,
    total_earnings = total_earnings + p_amount
  WHERE id = p_resource_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- DONE! Your database is ready.
-- ==============================================
-- Next steps:
-- 1. Copy your Supabase URL and anon key to .env
-- 2. Run: pnpm dev:all
-- 3. Open: http://localhost:3000
-- ==============================================

