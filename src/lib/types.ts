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
}

export interface DailyBalance {
    date: string;
    balance: number;
    label: string;
}

export type PeriodView = 'current' | 'next' | 'previous' | 'all';
