import { CreditCard, CreditCardSummary, Transaction } from './types';
import { getTodayStr } from './utils';

/**
 * Helper to get max days in a specific year and month (1-indexed month: 1..12).
 */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/**
 * Format year, month (1-indexed), day into 'YYYY-MM-DD'.
 */
export function toDateStr(year: number, month: number, day: number): string {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
}

/**
 * RFC 4122 v4 compliant UUID generator with crypto fallback.
 * Ensures PostgreSQL UUID type compatibility without syntax errors.
 */
export function generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Adjusts a date so that if it falls on a weekend (Saturday or Sunday),
 * it shifts forward to the next business weekday (Monday).
 */
export function adjustToNextWeekday(date: Date): Date {
    const result = new Date(date);
    const dayOfWeek = result.getDay(); // 0 = Sun, 6 = Sat
    if (dayOfWeek === 6) {
        // Saturday -> move to Monday (+2 days)
        result.setDate(result.getDate() + 2);
    } else if (dayOfWeek === 0) {
        // Sunday -> move to Monday (+1 day)
        result.setDate(result.getDate() + 1);
    }
    return result;
}

/**
 * Calculates the official payment due date from a statement cutoff date:
 * Rule: Cutoff date + 10 calendar days, shifted to the next weekday if falling on a weekend.
 * Example: Cutoff on 11 November -> +10 days is 21 November (Saturday) -> shifted to 23 November (Monday).
 */
export function calculateDueDateFromCutoff(cutoffDateStr: string): string {
    const [year, month, day] = cutoffDateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 10);
    const adjusted = adjustToNextWeekday(date);
    return toDateStr(adjusted.getFullYear(), adjusted.getMonth() + 1, adjusted.getDate());
}

/**
 * Calculates the statement cutoff date and payment due date for a purchase made on a card.
 * 
 * Rules:
 * 1. If purchase day <= cutoff_day:
 *    The statement cutoff is in the SAME month as purchase date.
 * 2. If purchase day > cutoff_day:
 *    The statement cutoff is in the NEXT month.
 * 3. Due date:
 *    Automatically calculated as statement cutoff date + 10 calendar days.
 *    If that falls on a weekend, it automatically shifts to the following Monday.
 * 4. All days are clamped to the month's maximum days (e.g. 31 clamped to 28/29 in Feb, 30 in Apr/Jun/Sep/Nov).
 */
export function calculateCardCutoffAndDueDate(
    card: Pick<CreditCard, 'cutoff_day'> & Partial<Pick<CreditCard, 'due_day'>>,
    purchaseDateStr: string
): { cutoffDate: string; dueDate: string } {
    const [pYearStr, pMonthStr, pDayStr] = purchaseDateStr.split('-');
    const pYear = parseInt(pYearStr, 10);
    const pMonth = parseInt(pMonthStr, 10); // 1..12
    const pDay = parseInt(pDayStr, 10);

    // Determine cutoff month and year
    let cutoffYear = pYear;
    let cutoffMonth = pMonth;

    if (pDay > card.cutoff_day) {
        if (cutoffMonth === 12) {
            cutoffYear += 1;
            cutoffMonth = 1;
        } else {
            cutoffMonth += 1;
        }
    }

    const maxDaysCutoff = getDaysInMonth(cutoffYear, cutoffMonth);
    const cutoffDay = Math.min(card.cutoff_day, maxDaysCutoff);
    const cutoffDate = toDateStr(cutoffYear, cutoffMonth, cutoffDay);

    // Automatic due date: Cutoff + 10 days, shifted to next weekday if weekend
    const dueDate = calculateDueDateFromCutoff(cutoffDate);

    return { cutoffDate, dueDate };
}

/**
 * Calculates the next upcoming calendar occurrence of a specific target day (1..31).
 * If today's day <= targetDay, the date is in the current month.
 * If today's day > targetDay, the date is in the next month.
 * Clamps days to the month's maximum (e.g. 31 clamped to 28 in Feb).
 */
export function getNextDateForDay(targetDay: number, fromDateStr?: string): string {
    const baseDate = fromDateStr || getTodayStr();
    const [yearStr, monthStr, dayStr] = baseDate.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    if (day > targetDay) {
        if (month === 12) {
            year += 1;
            month = 1;
        } else {
            month += 1;
        }
    }

    const maxDays = getDaysInMonth(year, month);
    const clampedDay = Math.min(targetDay, maxDays);
    return toDateStr(year, month, clampedDay);
}

/**
 * Calculates next upcoming cutoff and due date for card summary display.
 * Determines the relevant statement cutoff and its +10 day weekday due date.
 */
export function calculateNextCardCycle(
    card: Pick<CreditCard, 'cutoff_day'> & Partial<Pick<CreditCard, 'due_day'>>,
    fromDateStr?: string
): { nextCutoffDate: string; nextDueDate: string } {
    const baseDate = fromDateStr || getTodayStr();
    const [yearStr, monthStr] = baseDate.split('-');
    const baseYear = parseInt(yearStr, 10);
    const baseMonth = parseInt(monthStr, 10);

    // 1. Current month's cutoff date
    const maxDaysCurrent = getDaysInMonth(baseYear, baseMonth);
    const thisMonthCutoffDay = Math.min(card.cutoff_day, maxDaysCurrent);
    const thisMonthCutoffDate = toDateStr(baseYear, baseMonth, thisMonthCutoffDay);
    const thisMonthDueDate = calculateDueDateFromCutoff(thisMonthCutoffDate);

    // 2. Next month's cutoff date
    let nextMonthYear = baseYear;
    let nextMonth = baseMonth + 1;
    if (nextMonth > 12) {
        nextMonth = 1;
        nextMonthYear += 1;
    }
    const maxDaysNext = getDaysInMonth(nextMonthYear, nextMonth);
    const nextMonthCutoffDay = Math.min(card.cutoff_day, maxDaysNext);
    const nextMonthCutoffDate = toDateStr(nextMonthYear, nextMonth, nextMonthCutoffDay);
    const nextMonthDueDate = calculateDueDateFromCutoff(nextMonthCutoffDate);

    // If today is on or before this month's cutoff:
    if (baseDate <= thisMonthCutoffDate) {
        return {
            nextCutoffDate: thisMonthCutoffDate,
            nextDueDate: thisMonthDueDate,
        };
    }

    // Cutoff for this month has passed. If today is on or before this statement's due date:
    if (baseDate <= thisMonthDueDate) {
        return {
            nextCutoffDate: nextMonthCutoffDate,
            nextDueDate: thisMonthDueDate,
        };
    }

    // Both this month's cutoff and due date have passed:
    return {
        nextCutoffDate: nextMonthCutoffDate,
        nextDueDate: nextMonthDueDate,
    };
}

/**
 * Distributes total amount across installments without losing cents.
 * e.g. 1000 TL across 3 installments -> [333.34, 333.33, 333.33]
 */
export function distributeInstallmentAmounts(
    totalAmount: number,
    totalInstallments: number
): number[] {
    if (totalInstallments <= 1) {
        return [Number(totalAmount.toFixed(2))];
    }

    const totalCents = Math.round(totalAmount * 100);
    const baseCents = Math.floor(totalCents / totalInstallments);
    let remainderCents = totalCents - baseCents * totalInstallments;

    const amounts: number[] = [];
    for (let i = 0; i < totalInstallments; i++) {
        let cents = baseCents;
        if (remainderCents > 0) {
            cents += 1;
            remainderCents -= 1;
        }
        amounts.push(Number((cents / 100).toFixed(2)));
    }

    return amounts;
}

/**
 * Calculates due dates for all installments of a purchase.
 * Each installment's due date is automatically calculated from its corresponding
 * statement cutoff date: Cutoff + 10 calendar days, shifted to the next weekday if weekend.
 */
export function calculateInstallmentDueDates(
    card: Pick<CreditCard, 'cutoff_day'> & Partial<Pick<CreditCard, 'due_day'>>,
    purchaseDateStr: string,
    totalInstallments: number
): string[] {
    const cutoffDates = calculateInstallmentCutoffDates(card, purchaseDateStr, totalInstallments);
    return cutoffDates.map(cDate => calculateDueDateFromCutoff(cDate));
}

/**
 * Calculates statement cutoff dates for all installments of a purchase.
 * Under the cash flow model, credit card payments are assumed to leave
 * the bank account on the statement cutoff date.
 */
export function calculateInstallmentCutoffDates(
    card: Pick<CreditCard, 'cutoff_day'> & Partial<Pick<CreditCard, 'due_day'>>,
    purchaseDateStr: string,
    totalInstallments: number
): string[] {
    const { cutoffDate: firstCutoffDate } = calculateCardCutoffAndDueDate(card, purchaseDateStr);

    if (totalInstallments <= 1) {
        return [firstCutoffDate];
    }

    const [firstYearStr, firstMonthStr] = firstCutoffDate.split('-');
    const firstYear = parseInt(firstYearStr, 10);
    const firstMonth = parseInt(firstMonthStr, 10);

    const cutoffDates: string[] = [];

    for (let i = 0; i < totalInstallments; i++) {
        let targetMonth = firstMonth + i;
        let targetYear = firstYear;

        while (targetMonth > 12) {
            targetMonth -= 12;
            targetYear += 1;
        }

        const maxDays = getDaysInMonth(targetYear, targetMonth);
        const day = Math.min(card.cutoff_day, maxDays);
        cutoffDates.push(toDateStr(targetYear, targetMonth, day));
    }

    return cutoffDates;
}

/**
 * Generates transaction records for a credit card purchase (one-time or multi-installment).
 * The effective transaction_date is the payment due date (son ödeme tarihi),
 * when money actually leaves the bank account.
 */
export function generateCreditCardInstallments({
    title,
    totalAmount,
    purchaseDate,
    totalInstallments = 1,
    card,
    parentTransactionId,
}: {
    title: string;
    totalAmount: number;
    purchaseDate: string;
    totalInstallments: number;
    card: CreditCard;
    parentTransactionId?: string;
}): Array<Omit<Transaction, 'id' | 'created_at'>> {
    const installmentsCount = Math.max(1, totalInstallments);
    const amounts = distributeInstallmentAmounts(totalAmount, installmentsCount);
    const dueDates = calculateInstallmentDueDates(card, purchaseDate, installmentsCount);
    const parentId = parentTransactionId || generateUUID();

    return amounts.map((amount, index) => {
        const installmentNo = index + 1;
        const installmentTitle = installmentsCount > 1
            ? `${title} (${installmentNo}/${installmentsCount})`
            : title;

        return {
            title: installmentTitle,
            amount,
            transaction_date: dueDates[index],   // Cash flow deduction hits on payment due date (son ödeme tarihi)
            due_date: dueDates[index],           // Bank payment deadline
            purchase_date: purchaseDate,
            type: 'expense' as const,
            is_completed: false,
            completed_date: null,
            completed_amount: null,
            card_id: card.id,
            installment_no: installmentNo,
            total_installments: installmentsCount,
            parent_transaction_id: parentId,
        };
    });
}

/**
 * Computes debt, available limit, and pending transactions for each card.
 * Accurately accounts for expense vs refund/income transactions and clamps to precision.
 */
export function computeCardSummaries(
    cards: CreditCard[],
    transactions: Transaction[],
    currentDateStr?: string
): CreditCardSummary[] {
    const today = currentDateStr || getTodayStr();

    return cards.map(card => {
        // All uncompleted transactions linked to this card
        const cardTxns = transactions.filter(t => t.card_id === card.id && !t.is_completed);

        const currentDebt = cardTxns.reduce((sum, t) => {
            const effectiveAmount = t.completed_amount != null ? t.completed_amount : t.amount;
            return t.type === 'income' ? sum - effectiveAmount : sum + effectiveAmount;
        }, 0);

        const roundedDebt = Math.max(0, Number(currentDebt.toFixed(2)));
        const availableLimit = Math.max(0, Number((card.credit_limit - roundedDebt).toFixed(2)));
        const { nextCutoffDate, nextDueDate } = calculateNextCardCycle(card, today);

        return {
            ...card,
            current_debt: roundedDebt,
            available_limit: availableLimit,
            next_cutoff_date: nextCutoffDate,
            next_due_date: nextDueDate,
            pending_transactions_count: cardTxns.length,
        };
    });
}
