-- Migration: Add is_default to likit_credit_cards and set Sağlam Kart as default
-- Created: 2026-02-05

-- 1. Add is_default column if not exists
ALTER TABLE public.likit_credit_cards 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_likit_credit_cards_default 
ON public.likit_credit_cards (is_default) WHERE is_default = TRUE;

-- 3. Reset any existing defaults to false
UPDATE public.likit_credit_cards
SET is_default = FALSE;

-- 4. Set Sağlam Kart as default card
UPDATE public.likit_credit_cards
SET is_default = TRUE
WHERE id = '5b00766f-ccda-400b-aed9-7bb8fce8e01e' OR name = 'Sağlam Kart';
