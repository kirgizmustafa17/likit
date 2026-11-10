-- Likit Cash Flow Tracker - Complete Database Schema
-- Standart migration dosyaları: supabase/migrations/
-- Bu dosyayı doğrudan Supabase SQL Editor'de çalıştırabilirsiniz (idempotent DDL).

-- 1. Kredi Kartları Tablosu
CREATE TABLE IF NOT EXISTS public.likit_credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    bank_name TEXT,
    last_four_digits VARCHAR(4),
    color TEXT NOT NULL DEFAULT 'indigo',
    card_network TEXT NOT NULL DEFAULT 'other',
    credit_limit NUMERIC NOT NULL DEFAULT 0,
    cutoff_day INTEGER NOT NULL CHECK (cutoff_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_likit_credit_cards_active 
    ON public.likit_credit_cards (is_active);

ALTER TABLE public.likit_credit_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for anon on likit_credit_cards" ON public.likit_credit_cards;

CREATE POLICY "Allow all operations for anon on likit_credit_cards" 
    ON public.likit_credit_cards
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Nakit Akışı İşlemleri Tablosu
CREATE TABLE IF NOT EXISTS public.likit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    transaction_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    completed_date DATE,
    completed_amount NUMERIC,
    card_id UUID REFERENCES public.likit_credit_cards(id) ON DELETE SET NULL,
    purchase_date DATE,
    installment_no INTEGER DEFAULT 1,
    total_installments INTEGER DEFAULT 1,
    parent_transaction_id UUID
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_likit_transactions_date 
    ON public.likit_transactions (transaction_date);

CREATE INDEX IF NOT EXISTS idx_likit_transactions_completed 
    ON public.likit_transactions (is_completed);

CREATE INDEX IF NOT EXISTS idx_likit_transactions_card_id 
    ON public.likit_transactions (card_id);

CREATE INDEX IF NOT EXISTS idx_likit_transactions_parent_id 
    ON public.likit_transactions (parent_transaction_id);

-- Row Level Security (RLS)
ALTER TABLE public.likit_transactions ENABLE ROW LEVEL SECURITY;

-- Idempotent anon politikası
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.likit_transactions;

CREATE POLICY "Allow all operations for anon" 
    ON public.likit_transactions
    FOR ALL
    USING (true)
    WITH CHECK (true);
