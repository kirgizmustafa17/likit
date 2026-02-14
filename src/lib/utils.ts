import { format, addDays, startOfDay, isAfter, isBefore, isEqual, parseISO, subMonths, addMonths, setDate, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Transaction, DailyBalance } from './types';

const TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3

/**
 * Returns a Date object adjusted to UTC+3 (Turkey time).
 */
export function getNow(): Date {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + TIMEZONE_OFFSET_MS);
}

/**
 * Returns today's date string in 'yyyy-MM-dd' format, in UTC+3.
 */
export function getTodayStr(): string {
    const now = getNow();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string): string {
    return format(parseISO(date), 'd MMM yyyy', { locale: tr });
}

export function formatShortDate(date: string): string {
    return format(parseISO(date), 'd MMM', { locale: tr });
}

/**
 * Get the period range and chart display range.
 * Period: 15th of month X → 14th of month X+1 (1 month)
 * Chart:  13th of month X → 16th of month X+1 (period ± 2 days for context)
 * Period offset: 0 = current period, -1 = previous, +1 = next
 */
export function getPeriodRange(periodOffset: number = 0): {
    start: Date;
    end: Date;
    chartStart: Date;
    chartEnd: Date;
    label: string;
} {
    const now = getNow();
    const currentDay = now.getDate();

    // Determine the "current" period's start month
    // If we're before the 15th, the current period started on the 15th of the PREVIOUS month
    // If we're on/after the 15th, the current period started on the 15th of THIS month
    let periodStartMonth: Date;
    if (currentDay < 15) {
        periodStartMonth = subMonths(now, 1);
    } else {
        periodStartMonth = now;
    }

    // Apply offset
    periodStartMonth = addMonths(periodStartMonth, periodOffset);

    const start = setDate(startOfDay(periodStartMonth), 15);
    // End is 14th of the NEXT month (1-month period)
    const endMonth = addMonths(periodStartMonth, 1);
    const end = setDate(startOfDay(endMonth), 14);

    // Chart padding: ±2 days for context
    const chartStart = addDays(start, -2);
    const chartEnd = addDays(end, 2);

    const label = `${format(start, 'd MMM yyyy', { locale: tr })} – ${format(end, 'd MMM yyyy', { locale: tr })}`;

    return { start, end, chartStart, chartEnd, label };
}

/**
 * Calculate daily balance data from a list of transactions for graphing.
 */
export function calculateDailyBalances(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
): DailyBalance[] {
    if (transactions.length === 0) return [];

    // Sort all transactions by effective date
    const sorted = [...transactions].sort((a, b) => {
        const dateA = a.is_completed && a.completed_date ? a.completed_date : a.transaction_date;
        const dateB = b.is_completed && b.completed_date ? b.completed_date : b.transaction_date;
        return dateA.localeCompare(dateB);
    });

    // Compute running balance for ALL transactions up to endDate
    // First, calculate balance from all transactions before startDate
    let runningBalance = 0;
    const transactionsBeforeStart: Transaction[] = [];
    const transactionsInRange: Transaction[] = [];

    for (const t of sorted) {
        const effectiveDate = t.is_completed && t.completed_date ? t.completed_date : t.transaction_date;
        const d = parseISO(effectiveDate);
        if (isBefore(d, startDate)) {
            transactionsBeforeStart.push(t);
        } else {
            transactionsInRange.push(t);
        }
    }

    // Calculate balance leading up to the start of the range
    for (const t of transactionsBeforeStart) {
        const effectiveAmount = t.is_completed && t.completed_amount !== null && t.completed_amount !== undefined
            ? t.completed_amount
            : t.amount;
        if (t.type === 'income') {
            runningBalance += effectiveAmount;
        } else {
            runningBalance -= Math.abs(effectiveAmount);
        }
    }

    // Build a map of date -> list of transactions
    const dateMap = new Map<string, Transaction[]>();
    for (const t of transactionsInRange) {
        const effectiveDate = t.is_completed && t.completed_date ? t.completed_date : t.transaction_date;
        const dateKey = effectiveDate;
        if (!dateMap.has(dateKey)) {
            dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(t);
    }

    // Generate daily balances
    const dailyBalances: DailyBalance[] = [];
    const totalDays = differenceInDays(endDate, startDate) + 1;

    for (let i = 0; i < totalDays; i++) {
        const currentDate = addDays(startDate, i);
        const dateKey = format(currentDate, 'yyyy-MM-dd');

        // Apply transactions for this day
        const dayTransactions = dateMap.get(dateKey) || [];
        for (const t of dayTransactions) {
            const effectiveAmount = t.is_completed && t.completed_amount !== null && t.completed_amount !== undefined
                ? t.completed_amount
                : t.amount;
            if (t.type === 'income') {
                runningBalance += effectiveAmount;
            } else {
                runningBalance -= Math.abs(effectiveAmount);
            }
        }

        dailyBalances.push({
            date: dateKey,
            balance: runningBalance,
            label: format(currentDate, 'd MMM', { locale: tr }),
        });
    }

    return dailyBalances;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}
