-- Likit Cash Flow Tracker - Database Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS likit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  completed_date DATE,
  completed_amount NUMERIC
);

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_likit_transactions_date ON likit_transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_likit_transactions_completed ON likit_transactions (is_completed);

-- Enable Row Level Security (optional, disabled for simplicity)
ALTER TABLE likit_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (since we're using anon key)
CREATE POLICY "Allow all operations for anon" ON likit_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
