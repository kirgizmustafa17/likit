export type CardNetwork = 'troy' | 'visa' | 'mastercard' | 'other';

export interface CreditCard {
    id: string;
    created_at: string;
    name: string;
    bank_name?: string | null;
    last_four_digits?: string | null;
    color: string;
    card_network?: CardNetwork | null;
    credit_limit: number;
    cutoff_day: number;
    due_day: number;
    is_active: boolean;
    is_default?: boolean;
}

export interface CreditCardSummary extends CreditCard {
    current_debt: number;
    available_limit: number;
    next_cutoff_date: string;
    next_due_date: string;
    pending_transactions_count: number;
}

export interface Transaction {
    id: string;
    created_at: string;
    title: string;
    amount: number;
    transaction_date: string;
    is_completed: boolean;
    type: 'income' | 'expense';
    completed_date?: string | null;
    completed_amount?: number | null;
    // Credit card fields
    card_id?: string | null;
    purchase_date?: string | null;
    due_date?: string | null;
    installment_no?: number | null;
    total_installments?: number | null;
    parent_transaction_id?: string | null;
    card?: CreditCard | null;
}

export interface DailyBalance {
    date: string;
    balance: number;
    label: string;
}

export type PeriodView = 'current' | 'next' | 'previous' | 'all';
