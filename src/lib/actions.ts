import { supabase } from './supabase';
import { Transaction } from './types';

export async function getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('likit_transactions')
        .select('*')
        .order('transaction_date', { ascending: true });

    if (error) throw error;
    return (data as Transaction[]) || [];
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
