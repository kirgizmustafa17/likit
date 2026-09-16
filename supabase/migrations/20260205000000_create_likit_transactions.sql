-- Migration: 20260205000000_create_likit_transactions.sql
-- Description: Likit nakit akışı takip tablosu, indeksleri ve RLS güvenlik politikaları

CREATE TABLE IF NOT EXISTS public.likit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    transaction_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    completed_date DATE,
    completed_amount NUMERIC
);

-- Hızlı tarih ve durum filtrelemeleri için indeksler
CREATE INDEX IF NOT EXISTS idx_likit_transactions_date 
    ON public.likit_transactions (transaction_date);

CREATE INDEX IF NOT EXISTS idx_likit_transactions_completed 
    ON public.likit_transactions (is_completed);

-- Row Level Security (RLS)
ALTER TABLE public.likit_transactions ENABLE ROW LEVEL SECURITY;

-- Tekrarlanabilir (idempotent) anonim erişim politikası
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.likit_transactions;

CREATE POLICY "Allow all operations for anon" 
    ON public.likit_transactions
    FOR ALL
    USING (true)
    WITH CHECK (true);
