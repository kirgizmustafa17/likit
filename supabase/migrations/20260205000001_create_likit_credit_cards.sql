-- Migration: 20260205000001_create_likit_credit_cards.sql
-- Description: Kredi kartı yönetimi tablosu, likit_transactions ilişkisi ve RLS politikaları

-- 1. Kredi Kartları Tablosu
CREATE TABLE IF NOT EXISTS public.likit_credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    bank_name TEXT,
    last_four_digits VARCHAR(4),
    color TEXT NOT NULL DEFAULT 'indigo',
    credit_limit NUMERIC NOT NULL DEFAULT 0,
    cutoff_day INTEGER NOT NULL CHECK (cutoff_day BETWEEN 1 AND 31),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_likit_credit_cards_active 
    ON public.likit_credit_cards (is_active);

-- Row Level Security (RLS)
ALTER TABLE public.likit_credit_cards ENABLE ROW LEVEL SECURITY;

-- Idempotent anon politikası
DROP POLICY IF EXISTS "Allow all operations for anon on likit_credit_cards" ON public.likit_credit_cards;

CREATE POLICY "Allow all operations for anon on likit_credit_cards" 
    ON public.likit_credit_cards
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. likit_transactions Tablosuna Kredi Kartı Alanlarının Eklenmesi
ALTER TABLE public.likit_transactions
    ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES public.likit_credit_cards(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS purchase_date DATE,
    ADD COLUMN IF NOT EXISTS installment_no INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS parent_transaction_id UUID;

CREATE INDEX IF NOT EXISTS idx_likit_transactions_card_id 
    ON public.likit_transactions (card_id);

CREATE INDEX IF NOT EXISTS idx_likit_transactions_parent_id 
    ON public.likit_transactions (parent_transaction_id);
