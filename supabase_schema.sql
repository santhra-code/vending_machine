-- ==============================================================================
-- DIGITAL VENDING MACHINE FOR SANITARY NAPKINS - SUPABASE DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ and Supabase Hosted Database
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    size TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || substr(md5(random()::text), 1, 10)),
    product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'cancelled' | 'dispensed'
    payment_method TEXT,                    -- 'qr' | 'debit' | 'cash' | 'subscription_qr' | 'coin' | 'google_pay' | 'razorpay'
    user_identifier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SUBSCRIPTIONS TABLE (ANNUAL 1-YEAR HYGIENE PASS)
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT ('sub-' || substr(md5(random()::text), 1, 10)),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    card_code TEXT UNIQUE NOT NULL,         -- e.g. 'SAN-2025-8849'
    qr_data TEXT NOT NULL,                  -- Dynamic QR token payload
    status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'expired' | 'suspended'
    plan_name TEXT NOT NULL DEFAULT '1-Year Annual Sanitary Hygiene Pass',
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    annual_quota INTEGER NOT NULL DEFAULT 60, -- e.g. 5 pads per month * 12 months = 60
    monthly_quota INTEGER NOT NULL DEFAULT 5,
    used_quota INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DISPENSE LOGS TABLE (HARDWARE DISPENSING HISTORY)
CREATE TABLE IF NOT EXISTS dispense_logs (
    id TEXT PRIMARY KEY DEFAULT ('disp-' || substr(md5(random()::text), 1, 10)),
    order_id TEXT,
    product_id TEXT,
    product_name TEXT,
    qty INTEGER NOT NULL DEFAULT 1,
    method TEXT NOT NULL,                   -- 'subscription_qr' | 'coin' | 'google_pay' | 'razorpay' | 'debit' | 'cash'
    user_identifier TEXT,
    status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'dispensing' | 'failed'
    slot TEXT DEFAULT 'Tray-A1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. COIN TRANSACTIONS TABLE (PHYSICAL & VIRTUAL COIN ACCEPTOR)
CREATE TABLE IF NOT EXISTS coin_transactions (
    id TEXT PRIMARY KEY DEFAULT ('coin-' || substr(md5(random()::text), 1, 10)),
    order_id TEXT NOT NULL,
    amount_required NUMERIC(10, 2) NOT NULL,
    coins_inserted NUMERIC(10, 2) NOT NULL,
    change_returned NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed', -- 'in_progress' | 'completed' | 'refunded'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY DEFAULT ('adm-' || substr(md5(random()::text), 1, 8)),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. VISITS TABLE (VISITOR ANALYTICS)
CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY DEFAULT ('vis-' || substr(md5(random()::text), 1, 8)),
    ip_hash TEXT NOT NULL,
    day DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. SEED DEFAULT PRODUCTS IF EMPTY
INSERT INTO products (id, name, brand, size, price, stock, active)
VALUES 
    ('prod-001', 'Whisper Ultra Clean (XL+ Wings)', 'Whisper', 'XL+ (280mm)', 35.00, 24, true),
    ('prod-002', 'Stayfree Secure Cottony Soft', 'Stayfree', 'Regular (240mm)', 28.00, 30, true),
    ('prod-003', 'Sofy AntiBacterial Extra Long', 'Sofy', 'XXL (320mm)', 45.00, 18, true),
    ('prod-004', 'Nua Ultra Thin Rash-Free', 'Nua', 'Heavy Flow (290mm)', 40.00, 15, true),
    ('prod-005', 'Carmesi 100% Eco-Biodegradable', 'Carmesi', 'Standard (260mm)', 50.00, 20, true),
    ('prod-006', 'Santra Emergency Care Single Pad', 'Santra Vending', 'Regular (240mm)', 10.00, 50, true)
ON CONFLICT (id) DO NOTHING;

-- 10. SEED INITIAL SAMPLE ANNUAL SUBSCRIBERS
INSERT INTO subscriptions (id, user_name, user_email, user_phone, card_code, qr_data, status, plan_name, valid_from, valid_until, annual_quota, monthly_quota, used_quota)
VALUES
    ('sub-demo-01', 'Priya Sharma', 'priya.sharma@campus.edu', '+91 98765 43210', 'SAN-2025-PRIYA', 'SAN-SUB:SAN-2025-PRIYA:priya.sharma@campus.edu', 'active', '1-Year Student Annual Hygiene Pass', CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'), 60, 5, 2),
    ('sub-demo-02', 'Ananya Patel', 'ananya.patel@workplace.org', '+91 98123 45678', 'SAN-2025-ANANYA', 'SAN-SUB:SAN-2025-ANANYA:ananya.patel@workplace.org', 'active', '1-Year Institutional Care Pass', CURRENT_DATE, (CURRENT_DATE + INTERVAL '1 year'), 120, 10, 3)
ON CONFLICT (id) DO NOTHING;

-- 11. SEED DEFAULT ADMIN IF EMPTY
INSERT INTO admins (id, email, password)
VALUES ('adm-default', 'admin@local.test', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- 12. RLS & PERMISSIONS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispense_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Allow public read of active products
CREATE POLICY "Public products view" ON products FOR SELECT USING (active = true);

-- Allow public order insertion
CREATE POLICY "Public order creation" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public order reading" ON orders FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service full access products" ON products TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full access orders" ON orders TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full access subscriptions" ON subscriptions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full access dispense_logs" ON dispense_logs TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full access coin_transactions" ON coin_transactions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full access admins" ON admins TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service full access visits" ON visits TO service_role USING (true) WITH CHECK (true);
