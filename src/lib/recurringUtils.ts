import { RecurringRule, RecurringCategory, RecurringSummary, Transaction, CreditCard } from './types';
import { getDaysInMonth, calculateCardCutoffAndDueDate } from './creditCardUtils';
import { getNow } from './utils';

export const RECURRING_CATEGORIES: Record<
    RecurringCategory,
    { label: string; icon: string; defaultType: 'income' | 'expense' }
> = {
    salary: { label: 'Maaş', icon: '💼', defaultType: 'income' },
    extra_income: { label: 'Ek Gelir', icon: '💰', defaultType: 'income' },
    rent: { label: 'Kira', icon: '🏠', defaultType: 'expense' },
    dues: { label: 'Aidat', icon: '🏢', defaultType: 'expense' },
    bill: { label: 'Fatura', icon: '⚡', defaultType: 'expense' },
    subscription: { label: 'Abonelik', icon: '🔄', defaultType: 'expense' },
    other: { label: 'Diğer', icon: '🏷️', defaultType: 'expense' },
};

export function getCategoryLabel(category?: string | null): string {
    if (!category) return 'Düzenli';
    const cat = RECURRING_CATEGORIES[category as RecurringCategory];
    return cat ? cat.label : category;
}

export function getCategoryIcon(category?: string | null): string {
    if (!category) return '🔄';
    const cat = RECURRING_CATEGORIES[category as RecurringCategory];
    return cat ? cat.icon : '🔄';
}

/**
 * Calculates monthly summary stats from recurring rules.
 */
export function computeRecurringSummary(rules: RecurringRule[]): RecurringSummary {
    const activeRules = rules.filter((r) => r.is_active);
    let total_monthly_income = 0;
    let total_monthly_expense = 0;

    for (const rule of activeRules) {
        let monthlyAmount = Number(rule.amount) || 0;
        if (rule.frequency === 'weekly') {
            monthlyAmount = (monthlyAmount * 52) / 12;
        } else if (rule.frequency === 'yearly') {
            monthlyAmount = monthlyAmount / 12;
        }

        if (rule.type === 'income') {
            total_monthly_income += monthlyAmount;
        } else {
            total_monthly_expense += monthlyAmount;
        }
    }

    return {
        total_monthly_income: Math.round(total_monthly_income * 100) / 100,
        total_monthly_expense: Math.round(total_monthly_expense * 100) / 100,
        net_monthly_flow: Math.round((total_monthly_income - total_monthly_expense) * 100) / 100,
        active_rules_count: activeRules.length,
    };
}

/**
 * Clamps a day of month to the valid range for that specific month & year.
 * (e.g. 31 February -> 28 or 29 February)
 */
export function clampDayToMonth(year: number, month: number, targetDay: number): number {
    const maxDays = getDaysInMonth(year, month);
    return Math.min(Math.max(1, targetDay), maxDays);
}

/**
 * Generates expected transaction occurrences for a given recurring rule
 * starting from the rule's start_date (or reference date) up to horizonMonths ahead.
 */
export function generateRecurringOccurrences({
    rule,
    cards = [],
    horizonMonths = 12,
    referenceDate = getNow(),
}: {
    rule: RecurringRule;
    cards?: CreditCard[];
    horizonMonths?: number;
    referenceDate?: Date;
}): Array<Omit<Transaction, 'id' | 'created_at'>> {
    if (!rule.is_active) return [];

    const occurrences: Array<Omit<Transaction, 'id' | 'created_at'>> = [];
    const ruleStart = new Date(rule.start_date);
    const ruleEnd = rule.end_date ? new Date(rule.end_date) : null;

    // Horizon target date (current date + horizonMonths)
    const horizonEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + horizonMonths + 1, 0);

    const card = rule.card_id ? (rule.card || cards.find((c) => c.id === rule.card_id) || null) : null;

    if (rule.frequency === 'monthly') {
        // Iterate month by month
        const startYear = ruleStart.getFullYear();
        const startMonth = ruleStart.getMonth() + 1; // 1-12

        const endYear = horizonEnd.getFullYear();
        const endMonth = horizonEnd.getMonth() + 1;

        let curYear = startYear;
        let curMonth = startMonth;

        while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
            const day = clampDayToMonth(curYear, curMonth, rule.day_of_month);
            const dateStr = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const occurrenceDate = new Date(dateStr);

            // Check if before start_date or after end_date
            if (occurrenceDate >= ruleStart && (!ruleEnd || occurrenceDate <= ruleEnd)) {
                if (rule.payment_method === 'credit_card' && card) {
                    // Credit card payment: charge date is dateStr, cashflow date is statement cutoff date
                    const { cutoffDate, dueDate } = calculateCardCutoffAndDueDate(card, dateStr);
                    occurrences.push({
                        title: rule.title,
                        amount: Number(rule.amount),
                        transaction_date: cutoffDate,
                        is_completed: false,
                        type: rule.type,
                        card_id: card.id,
                        purchase_date: dateStr,
                        due_date: dueDate,
                        installment_no: 1,
                        total_installments: 1,
                        recurring_rule_id: rule.id,
                        category: rule.category,
                        card,
                    });
                } else {
                    // Cash / Bank payment
                    occurrences.push({
                        title: rule.title,
                        amount: Number(rule.amount),
                        transaction_date: dateStr,
                        is_completed: false,
                        type: rule.type,
                        card_id: null,
                        recurring_rule_id: rule.id,
                        category: rule.category,
                    });
                }
            }

            curMonth++;
            if (curMonth > 12) {
                curMonth = 1;
                curYear++;
            }
        }
    } else if (rule.frequency === 'yearly') {
        // Yearly: occurs on the specified month & day of rule.start_date
        const targetMonth = ruleStart.getMonth() + 1;
        let curYear = ruleStart.getFullYear();
        const endYear = horizonEnd.getFullYear();

        while (curYear <= endYear) {
            const day = clampDayToMonth(curYear, targetMonth, rule.day_of_month);
            const dateStr = `${curYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const occurrenceDate = new Date(dateStr);

            if (occurrenceDate >= ruleStart && (!ruleEnd || occurrenceDate <= ruleEnd)) {
                if (rule.payment_method === 'credit_card' && card) {
                    const { cutoffDate, dueDate } = calculateCardCutoffAndDueDate(card, dateStr);
                    occurrences.push({
                        title: rule.title,
                        amount: Number(rule.amount),
                        transaction_date: cutoffDate,
                        is_completed: false,
                        type: rule.type,
                        card_id: card.id,
                        purchase_date: dateStr,
                        due_date: dueDate,
                        installment_no: 1,
                        total_installments: 1,
                        recurring_rule_id: rule.id,
                        category: rule.category,
                        card,
                    });
                } else {
                    occurrences.push({
                        title: rule.title,
                        amount: Number(rule.amount),
                        transaction_date: dateStr,
                        is_completed: false,
                        type: rule.type,
                        card_id: null,
                        recurring_rule_id: rule.id,
                        category: rule.category,
                    });
                }
            }
            curYear++;
        }
    }

    return occurrences;
}

/**
 * Identifies which recurring occurrences have not yet been materialized into
 * `likit_transactions`. Matches by `recurring_rule_id` and period/date.
 */
export function identifyMissingRecurringTransactions({
    rule,
    existingTransactions,
    cards = [],
    horizonMonths = 12,
    referenceDate = getNow(),
}: {
    rule: RecurringRule;
    existingTransactions: Transaction[];
    cards?: CreditCard[];
    horizonMonths?: number;
    referenceDate?: Date;
}): Array<Omit<Transaction, 'id' | 'created_at'>> {
    const expectedOccurrences = generateRecurringOccurrences({
        rule,
        cards,
        horizonMonths,
        referenceDate,
    });

    const ruleTransactions = existingTransactions.filter((t) => t.recurring_rule_id === rule.id);

    return expectedOccurrences.filter((expected) => {
        // Compare by transaction_date (or purchase_date if credit card)
        const alreadyExists = ruleTransactions.some((existing) => {
            if (expected.purchase_date && existing.purchase_date) {
                return existing.purchase_date === expected.purchase_date;
            }
            return existing.transaction_date === expected.transaction_date;
        });

        return !alreadyExists;
    });
}
