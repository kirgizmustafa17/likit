import { supabase } from './supabase';
import { Transaction, CreditCard, RecurringRule } from './types';
import { generateCreditCardInstallments } from './creditCardUtils';
import { generateRecurringOccurrences, identifyMissingRecurringTransactions } from './recurringUtils';
import { getTodayStr } from './utils';

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

export async function addCreditCard(
    card: Omit<CreditCard, 'id' | 'created_at'>
): Promise<CreditCard> {
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

/* ─── Recurring Rules Actions ─── */

export async function getRecurringRules(): Promise<RecurringRule[]> {
    try {
        const { data, error } = await supabase
            .from('likit_recurring_rules')
            .select('*, card:likit_credit_cards(*)')
            .order('day_of_month', { ascending: true });

        if (error) {
            console.warn('getRecurringRules error:', error.message);
            return [];
        }
        return (data as RecurringRule[]) || [];
    } catch (err) {
        console.error('getRecurringRules exception:', err);
        return [];
    }
}

export async function addRecurringRule(
    ruleData: Omit<RecurringRule, 'id' | 'created_at'>,
    cards: CreditCard[] = []
): Promise<{ rule: RecurringRule; createdTransactionsCount: number }> {
    // 1. Insert rule into likit_recurring_rules
    const cleanRuleData = { ...ruleData };
    delete (cleanRuleData as { card?: unknown }).card;
    const { data, error } = await supabase
        .from('likit_recurring_rules')
        .insert(cleanRuleData)
        .select('*, card:likit_credit_cards(*)')
        .single();

    if (error) throw error;
    const createdRule = data as RecurringRule;

    // 2. Generate occurrences for 12 months ahead
    const occurrences = generateRecurringOccurrences({
        rule: createdRule,
        cards,
        horizonMonths: 12,
    });

    let createdCount = 0;
    if (occurrences.length > 0) {
        // Strip out 'card' object before inserting into likit_transactions
        const sanitizedOccurrences = occurrences.map((occ) => {
            const item = { ...occ };
            delete (item as { card?: unknown }).card;
            return item;
        });
        const { data: insertedTxns, error: txError } = await supabase
            .from('likit_transactions')
            .insert(sanitizedOccurrences)
            .select();

        if (txError) {
            console.error('Error creating recurring occurrences:', txError);
        } else {
            createdCount = insertedTxns?.length || 0;
        }
    }

    return { rule: createdRule, createdTransactionsCount: createdCount };
}

export async function updateRecurringRule(
    id: string,
    updates: Partial<Omit<RecurringRule, 'id' | 'created_at'>>,
    updateFutureTxns: boolean = true
): Promise<RecurringRule> {
    const cleanUpdates = { ...updates };
    delete (cleanUpdates as { card?: unknown }).card;
    const { data, error } = await supabase
        .from('likit_recurring_rules')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*, card:likit_credit_cards(*)')
        .single();

    if (error) throw error;
    const updatedRule = data as RecurringRule;

    if (updateFutureTxns) {
        const today = getTodayStr();
        // Update uncompleted future occurrences with new amount, title, and category
        const syncFields: Record<string, unknown> = {};
        if (updates.amount !== undefined) syncFields.amount = Number(updates.amount);
        if (updates.title !== undefined) syncFields.title = updates.title;
        if (updates.category !== undefined) syncFields.category = updates.category;

        if (Object.keys(syncFields).length > 0) {
            await supabase
                .from('likit_transactions')
                .update(syncFields)
                .eq('recurring_rule_id', id)
                .eq('is_completed', false)
                .gte('transaction_date', today);
        }
    }

    return updatedRule;
}

export async function deleteRecurringRule(
    id: string,
    deleteFutureTxns: boolean = true
): Promise<void> {
    // 1. Delete future uncompleted transactions if requested
    if (deleteFutureTxns) {
        await supabase
            .from('likit_transactions')
            .delete()
            .eq('recurring_rule_id', id)
            .eq('is_completed', false);
    } else {
        // Unlink so historical reference remains
        await supabase
            .from('likit_transactions')
            .update({ recurring_rule_id: null })
            .eq('recurring_rule_id', id);
    }

    // 2. Delete the rule itself
    const { error } = await supabase
        .from('likit_recurring_rules')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function toggleRecurringRuleActive(
    id: string,
    isActive: boolean
): Promise<RecurringRule> {
    const { data, error } = await supabase
        .from('likit_recurring_rules')
        .update({ is_active: isActive })
        .eq('id', id)
        .select('*, card:likit_credit_cards(*)')
        .single();

    if (error) throw error;
    return data as RecurringRule;
}

/**
 * Syncs all active recurring rules against existing transactions.
 * Automatically materializes missing future occurrences up to horizonMonths.
 */
export async function syncAllRecurringRules({
    rules,
    existingTransactions,
    cards = [],
    horizonMonths = 12,
}: {
    rules?: RecurringRule[];
    existingTransactions?: Transaction[];
    cards?: CreditCard[];
    horizonMonths?: number;
}): Promise<number> {
    const activeRules = rules || (await getRecurringRules()).filter((r) => r.is_active);
    const txns = existingTransactions || (await getTransactions());

    let allMissing: Array<Omit<Transaction, 'id' | 'created_at'>> = [];

    for (const rule of activeRules) {
        if (!rule.is_active) continue;
        const missing = identifyMissingRecurringTransactions({
            rule,
            existingTransactions: txns,
            cards,
            horizonMonths,
        });
        allMissing = allMissing.concat(missing);
    }

    if (allMissing.length === 0) return 0;

    // Sanitize by omitting the virtual card relation before inserting
    const sanitized = allMissing.map((m) => {
        const item = { ...m };
        delete (item as { card?: unknown }).card;
        return item;
    });

    const { data, error } = await supabase
        .from('likit_transactions')
        .insert(sanitized)
        .select();

    if (error) {
        console.error('syncAllRecurringRules insertion error:', error);
        return 0;
    }

    return data?.length || 0;
}
