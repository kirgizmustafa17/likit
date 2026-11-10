import { createClient } from '@supabase/supabase-js';

if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
        process.loadEnvFile('.env.local');
    } catch {
        // file not present or not readable in current environment
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

