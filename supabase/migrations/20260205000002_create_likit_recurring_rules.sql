-- Migration: 20260205000002_create_likit_recurring_rules.sql
-- Description: Düzenli gelir/gider kuralları tablosu, indeksleri, RLS ve likit_transactions ilişkisi

-- 1. Düzenli İşlem Kuralları Tablosu
CREATE TABLE IF NOT EXISTS public.likit_recurring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL CHECK (category IN (
        'rent',          -- Kira
        'salary',        -- Maaş
        'bill',          -- Faturalar (Elektrik, Su, Doğalgaz, İnternet, Telefon)
        'dues',          -- Aidat
        'extra_income',  -- Ek Gelir / Ödeme
        'subscription',  -- Abonelik
        'other'          -- Diğer
    )),
    day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'weekly', 'yearly')),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card')),
    card_id UUID REFERENCES public.likit_credit_cards(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_likit_recurring_rules_active 
    ON public.likit_recurring_rules (is_active);
CREATE INDEX IF NOT EXISTS idx_likit_recurring_rules_category 
    ON public.likit_recurring_rules (category);
CREATE INDEX IF NOT EXISTS idx_likit_recurring_rules_card_id 
    ON public.likit_recurring_rules (card_id);

-- RLS Politikaları
ALTER TABLE public.likit_recurring_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for anon on likit_recurring_rules" 
    ON public.likit_recurring_rules;

CREATE POLICY "Allow all operations for anon on likit_recurring_rules" 
    ON public.likit_recurring_rules
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. likit_transactions Tablosuna Düzenli İşlem Alanlarının Eklenmesi
ALTER TABLE public.likit_transactions
    ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES public.likit_recurring_rules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS idx_likit_transactions_recurring_rule_id 
    ON public.likit_transactions (recurring_rule_id);
