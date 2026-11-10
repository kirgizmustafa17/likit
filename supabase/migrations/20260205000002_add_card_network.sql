-- Migration: Add card_network to likit_credit_cards and clean card names
-- Created: 2026-02-05

-- 1. Add card_network column if not exists
ALTER TABLE public.likit_credit_cards 
ADD COLUMN IF NOT EXISTS card_network TEXT NOT NULL DEFAULT 'other';

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_likit_credit_cards_network 
ON public.likit_credit_cards (card_network);

-- 3. Update existing cards to clean network names and assign network + signature theme colors
UPDATE public.likit_credit_cards
SET 
  name = 'Bankkart Gold',
  card_network = 'troy',
  color = 'troy-marine'
WHERE id = '1af07145-8735-4256-b8a9-7483d6ad847c';

UPDATE public.likit_credit_cards
SET 
  name = 'Axess Gold',
  card_network = 'troy',
  color = 'troy-cyan'
WHERE id = 'b4c11d6b-4e1e-45f8-b696-8c65c7eeae15';

UPDATE public.likit_credit_cards
SET 
  name = 'Tercih Express',
  card_network = 'visa',
  color = 'visa-royal'
WHERE id = '2c53126f-b8cc-4005-8611-15f94fa87c02';

UPDATE public.likit_credit_cards
SET 
  name = 'Sağlam Kart',
  card_network = 'troy',
  color = 'troy-midnight'
WHERE id = '5b00766f-ccda-400b-aed9-7bb8fce8e01e';

UPDATE public.likit_credit_cards
SET 
  name = 'Enpara',
  card_network = 'mastercard',
  color = 'mastercard-obsidian'
WHERE id = 'af4aae08-b401-42d8-912c-2b4e227cb8b6';

UPDATE public.likit_credit_cards
SET 
  name = 'Bonus Flexi',
  card_network = 'mastercard',
  color = 'mastercard-ember'
WHERE id = '32bb37a1-b67c-4fee-9ba1-0a60d5dfcd9b';

UPDATE public.likit_credit_cards
SET 
  name = 'Hepsiburada World',
  card_network = 'visa',
  color = 'visa-gold'
WHERE id = 'b1632378-c8fa-4e52-b14b-f6756c77083c';
