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
 * Calculates the statement cutoff date and payment due date for a purchase made on a card.
 * 
 * Rules:
 * 1. If purchase day <= cutoff_day:
 *    The statement cutoff is in the SAME month as purchase date.
 * 2. If purchase day > cutoff_day:
 *    The statement cutoff is in the NEXT month.
 * 3. Due date:
 *    - If due_day > cutoff_day: due date is in the SAME month as cutoff.
 *    - If due_day <= cutoff_day: due date is in the NEXT month following cutoff.
 * 4. All days are clamped to the month's maximum days (e.g. 31 clamped to 28/29 in Feb, 30 in Apr/Jun/Sep/Nov).
 */
export function calculateCardCutoffAndDueDate(
    card: Pick<CreditCard, 'cutoff_day' | 'due_day'>,
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

    // Determine due month and year
    let dueYear = cutoffYear;
    let dueMonth = cutoffMonth;

    if (card.due_day <= card.cutoff_day) {
        // Due date is in next month
        if (dueMonth === 12) {
            dueYear += 1;
            dueMonth = 1;
        } else {
            dueMonth += 1;
        }
    }

    const maxDaysDue = getDaysInMonth(dueYear, dueMonth);
    const dueDay = Math.min(card.due_day, maxDaysDue);
    const dueDate = toDateStr(dueYear, dueMonth, dueDay);

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
 * Tracks each date independently so an upcoming payment due date in the current
 * cycle is never skipped even if the cutoff date has already passed.
 */
export function calculateNextCardCycle(
    card: Pick<CreditCard, 'cutoff_day' | 'due_day'>,
    fromDateStr?: string
): { nextCutoffDate: string; nextDueDate: string } {
    const baseDate = fromDateStr || getTodayStr();
    return {
        nextCutoffDate: getNextDateForDay(card.cutoff_day, baseDate),
        nextDueDate: getNextDateForDay(card.due_day, baseDate),
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
 */
export function calculateInstallmentDueDates(
    card: Pick<CreditCard, 'cutoff_day' | 'due_day'>,
    purchaseDateStr: string,
    totalInstallments: number
): string[] {
    const { dueDate: firstDueDate } = calculateCardCutoffAndDueDate(card, purchaseDateStr);

    if (totalInstallments <= 1) {
        return [firstDueDate];
    }

    const [firstYearStr, firstMonthStr] = firstDueDate.split('-');
    const firstYear = parseInt(firstYearStr, 10);
    const firstMonth = parseInt(firstMonthStr, 10);

    const dueDates: string[] = [];

    for (let i = 0; i < totalInstallments; i++) {
        let targetMonth = firstMonth + i;
        let targetYear = firstYear;

        while (targetMonth > 12) {
            targetMonth -= 12;
            targetYear += 1;
        }

        const maxDays = getDaysInMonth(targetYear, targetMonth);
        const day = Math.min(card.due_day, maxDays);
        dueDates.push(toDateStr(targetYear, targetMonth, day));
    }

    return dueDates;
}

/**
 * Calculates statement cutoff dates for all installments of a purchase.
 * Under the cash flow model, credit card payments are assumed to leave
 * the bank account on the statement cutoff date.
 */
export function calculateInstallmentCutoffDates(
    card: Pick<CreditCard, 'cutoff_day' | 'due_day'>,
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
 * The effective transaction_date is the statement cutoff date (hesap kesim tarihi),
 * while due_date preserves the official bank payment deadline.
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
    const cutoffDates = calculateInstallmentCutoffDates(card, purchaseDate, installmentsCount);
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
            transaction_date: cutoffDates[index], // Cash flow deduction hits on statement cutoff date
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
