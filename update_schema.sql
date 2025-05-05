-- Update products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS rental_price_per_day INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rental_price_per_week INTEGER,
  ADD COLUMN IF NOT EXISTS rental_price_per_month INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER,
  ADD COLUMN IF NOT EXISTS condition TEXT,
  ADD COLUMN IF NOT EXISTS age_in_months INTEGER,
  ADD COLUMN IF NOT EXISTS available_for_rent BOOLEAN DEFAULT TRUE;

-- Create rental_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS rental_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  rental_start_date TIMESTAMP,
  rental_end_date TIMESTAMP,
  actual_return_date TIMESTAMP,
  rental_duration INTEGER,
  rental_period_type TEXT,
  deposit_amount INTEGER,
  total_amount INTEGER NOT NULL,
  condition_before TEXT,
  condition_after TEXT,
  damage_description TEXT,
  damage_fee INTEGER,
  status TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Create rental_reservation table if it doesn't exist
CREATE TABLE IF NOT EXISTS rental_reservation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  reservation_start_date TIMESTAMP NOT NULL,
  reservation_end_date TIMESTAMP NOT NULL,
  deposit_amount INTEGER,
  status TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Update order_items table for rental
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER,
  ADD COLUMN IF NOT EXISTS rental_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rental_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rental_duration INTEGER,
  ADD COLUMN IF NOT EXISTS rental_period_type TEXT,
  ADD COLUMN IF NOT EXISTS condition_before TEXT,
  ADD COLUMN IF NOT EXISTS condition_after TEXT,
  ADD COLUMN IF NOT EXISTS damage_description TEXT,
  ADD COLUMN IF NOT EXISTS damage_fee INTEGER;

-- Update cart_items table for rental
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS rental_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rental_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rental_duration INTEGER,
  ADD COLUMN IF NOT EXISTS rental_period_type TEXT;

-- Update orders table for rental
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS rental_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rental_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_returned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deposit_return_date TIMESTAMP;