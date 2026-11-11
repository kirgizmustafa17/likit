import { supabase } from './supabase';
import { Transaction, CreditCard } from './types';
import { generateCreditCardInstallments } from './creditCardUtils';

export async function getTransactions(): Promise<Transaction[]> {
    try {
        const { data, error } = await supabase
            .from('likit_transactions')
            .select('*, card:likit_credit_cards(*)')
            .order('transaction_date', { ascending: true });

        if (error) {
            // Fallback to simple select if relation doesn't exist yet
            const { data: simpleData, error: simpleError } = await supabase
                .from('likit_transactions')
                .select('*')
                .order('transaction_date', { ascending: true });

            if (simpleError) throw simpleError;
            return (simpleData as Transaction[]) || [];
        }

        return (data as Transaction[]) || [];
    } catch (err) {
        console.error('getTransactions error:', err);
        throw err;
    }
}

export async function addTransaction(
    transaction: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> {
    const { data, error } = await supabase
        .from('likit_transactions')
        .insert(transaction)
        .select()
        .single();

    if (error) throw error;
    return data as Transaction;
}

export async function updateTransaction(
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'created_at'>>
): Promise<Transaction> {
    const { data, error } = await supabase
        .from('likit_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
        .from('likit_transactions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function deleteTransactionGroup(parentTransactionId: string): Promise<void> {
    const { error } = await supabase
        .from('likit_transactions')
        .delete()
        .eq('parent_transaction_id', parentTransactionId);

    if (error) throw error;
}

export async function markTransactionCompleted(
    id: string,
    completedDate: string,
    completedAmount: number
): Promise<Transaction> {
    const { data, error } = await supabase
        .from('likit_transactions')
        .update({
            is_completed: true,
            completed_date: completedDate,
            completed_amount: completedAmount,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Transaction;
}

/* ─── Credit Cards Actions ─── */

export async function getCreditCards(): Promise<CreditCard[]> {
    const { data, error } = await supabase
        .from('likit_credit_cards')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

    if (error) {
        console.warn('getCreditCards query error (table might be empty or migrating):', error.message);
        return [];
    }
    return (data as CreditCard[]) || [];
}

export async function setDefaultCreditCard(id: string): Promise<CreditCard> {
    // 1. Reset all cards' is_default to false
    await supabase
        .from('likit_credit_cards')
        .update({ is_default: false })
        .neq('id', id);

    // 2. Set the target card's is_default to true
    const { data, error } = await supabase
        .from('likit_credit_cards')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CreditCard;
}

export async function addCreditCard(
    card: Omit<CreditCard, 'id' | 'created_at'>
): Promise<CreditCard> {
    if (card.is_default) {
        await supabase
            .from('likit_credit_cards')
            .update({ is_default: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await supabase
        .from('likit_credit_cards')
        .insert(card)
        .select()
        .single();

    if (error) throw error;
    return data as CreditCard;
}

export async function updateCreditCard(
    id: string,
    updates: Partial<Omit<CreditCard, 'id' | 'created_at'>>
): Promise<CreditCard> {
    if (updates.is_default) {
        await supabase
            .from('likit_credit_cards')
            .update({ is_default: false })
            .neq('id', id);
    }

    const { data, error } = await supabase
        .from('likit_credit_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as CreditCard;
}

export async function deleteCreditCard(id: string): Promise<void> {
    // Soft delete so historical transaction records remain valid
    const { error } = await supabase
        .from('likit_credit_cards')
        .update({ is_active: false })
        .eq('id', id);

    if (error) throw error;
}

export async function addCreditCardExpense({
    title,
    totalAmount,
    purchaseDate,
    totalInstallments,
    card,
}: {
    title: string;
    totalAmount: number;
    purchaseDate: string;
    totalInstallments: number;
    card: CreditCard;
}): Promise<Transaction[]> {
    const installments = generateCreditCardInstallments({
        title,
        totalAmount,
        purchaseDate,
        totalInstallments,
        card,
    });

    const { data, error } = await supabase
        .from('likit_transactions')
        .insert(installments)
        .select();

    if (error) throw error;
    return (data as Transaction[]) || [];
}
