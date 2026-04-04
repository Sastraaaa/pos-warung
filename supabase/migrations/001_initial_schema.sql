-- ============================================================
-- POS Warung Kelontong — Initial Schema Migration
-- ============================================================
-- This migration creates the complete database schema for the
-- offline-first POS system. Apply via Supabase Dashboard SQL
-- Editor or CLI: supabase db push
--
-- NOTE: For offline-first sync, the Service Worker will use
-- the Supabase service_role key for background sync operations.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. GENERIC TRIGGER FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Umum',
  capital_price NUMERIC(12,0) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,0) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_flag BOOLEAN NOT NULL DEFAULT false,
  checkout_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at on products
CREATE TRIGGER set_products_updated_at
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: auto-set low_stock_flag when current_stock <= 5
CREATE OR REPLACE FUNCTION set_low_stock_flag()
RETURNS TRIGGER AS $$
BEGIN
  NEW.low_stock_flag = (NEW.current_stock <= 5);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_products_low_stock_flag
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_low_stock_flag();

-- ============================================================
-- 3. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  total_outstanding_debt NUMERIC(14,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-update updated_at on customers
CREATE TRIGGER set_customers_updated_at
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('LUNAS', 'KASBON_FULL', 'SEBAGIAN')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  total_amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  debt_created NUMERIC(14,0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_synced BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================
-- 5. TRANSACTION ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  historical_capital_price NUMERIC(12,0) NOT NULL,
  historical_selling_price NUMERIC(12,0) NOT NULL
);

-- ============================================================
-- 6. TRIGGER: increment checkout_count on transaction_items insert
-- ============================================================
CREATE OR REPLACE FUNCTION increment_checkout_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET checkout_count = checkout_count + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_checkout_count
  AFTER INSERT ON transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION increment_checkout_count();

-- ============================================================
-- 7. TRIGGER: update customer debt on kasbon transactions
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_debt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.transaction_type IN ('KASBON_FULL', 'SEBAGIAN') AND NEW.debt_created > 0 THEN
    UPDATE customers
    SET total_outstanding_debt = total_outstanding_debt + NEW.debt_created
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_debt
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_debt();

-- ============================================================
-- 8. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(low_stock_flag);
CREATE INDEX IF NOT EXISTS idx_products_checkout_count ON products(checkout_count DESC);
CREATE INDEX IF NOT EXISTS idx_customers_debt ON customers(total_outstanding_debt DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(is_synced);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Single-owner app: allow all operations for authenticated users.
-- For background sync, the service_role key bypasses RLS automatically.
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON transaction_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. HELPER FUNCTION: get_daily_summary(p_date DATE)
-- ============================================================
CREATE OR REPLACE FUNCTION get_daily_summary(p_date DATE)
RETURNS TABLE (
  total_transactions BIGINT,
  total_revenue NUMERIC,
  total_profit NUMERIC,
  total_kasbon NUMERIC,
  total_outstanding_debt NUMERIC
) AS $$
DECLARE
  v_total_transactions BIGINT;
  v_total_revenue NUMERIC := 0;
  v_total_profit NUMERIC := 0;
  v_total_kasbon NUMERIC := 0;
  v_total_outstanding_debt NUMERIC := 0;
BEGIN
  -- Count transactions for the given date
  SELECT COUNT(*)
  INTO v_total_transactions
  FROM transactions
  WHERE created_at::date = p_date;

  -- Total revenue (paid_amount for LUNAS transactions)
  SELECT COALESCE(SUM(paid_amount), 0)
  INTO v_total_revenue
  FROM transactions
  WHERE created_at::date = p_date AND transaction_type = 'LUNAS';

  -- Total profit (sum of margin * quantity for all transaction items on that date)
  SELECT COALESCE(SUM((ti.historical_selling_price - ti.historical_capital_price) * ti.quantity), 0)
  INTO v_total_profit
  FROM transaction_items ti
  JOIN transactions t ON ti.transaction_id = t.id
  WHERE t.created_at::date = p_date;

  -- Total kasbon (sum of debt_created for kasbon transactions on that date)
  SELECT COALESCE(SUM(debt_created), 0)
  INTO v_total_kasbon
  FROM transactions
  WHERE created_at::date = p_date AND transaction_type IN ('KASBON_FULL', 'SEBAGIAN');

  -- Total outstanding debt (current sum across all customers)
  SELECT COALESCE(SUM(total_outstanding_debt), 0)
  INTO v_total_outstanding_debt
  FROM customers;

  RETURN QUERY SELECT
    v_total_transactions,
    v_total_revenue,
    v_total_profit,
    v_total_kasbon,
    v_total_outstanding_debt;
END;
$$ LANGUAGE plpgsql;

COMMIT;
