-- 1. Tabloyu temizle
DROP TABLE IF EXISTS public.likit_transactions_duplicate;

-- 2. Eski politikaları kaldır
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.likit_transactions;
DROP POLICY IF EXISTS "Allow all operations for anon on likit_credit_cards" ON public.likit_credit_cards;
DROP POLICY IF EXISTS "Allow all operations for anon on likit_recurring_rules" ON public.likit_recurring_rules;

-- 3. Yeni politikaları ekle
CREATE POLICY "Allow authenticated access" 
    ON public.likit_transactions
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = '4cbcc17a1e4d99b23c7d474858aaa5f82aad2bbc81c441b8cf6037485b02c1ef');

CREATE POLICY "Allow authenticated access" 
    ON public.likit_credit_cards
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = '4cbcc17a1e4d99b23c7d474858aaa5f82aad2bbc81c441b8cf6037485b02c1ef');

CREATE POLICY "Allow authenticated access" 
    ON public.likit_recurring_rules
    FOR ALL
    USING (current_setting('request.headers', true)::json->>'x-app-secret' = '4cbcc17a1e4d99b23c7d474858aaa5f82aad2bbc81c441b8cf6037485b02c1ef');