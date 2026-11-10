import { CreditCard, CreditCardSummary, Transaction, CardNetwork } from './types';
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

/* ─── Card Network & Dynamic Theming ─── */

export interface CardNetworkOption {
    id: CardNetwork;
    name: string;
    shortLabel: string;
    defaultColor: string;
    description: string;
}

export const CARD_NETWORKS: CardNetworkOption[] = [
    { id: 'troy', name: 'Troy', shortLabel: 'TROY', defaultColor: 'troy-cyan', description: "Türkiye'nin Ödeme Yöntemi" },
    { id: 'visa', name: 'Visa', shortLabel: 'VISA', defaultColor: 'visa-royal', description: 'Visa Global' },
    { id: 'mastercard', name: 'Mastercard', shortLabel: 'MC', defaultColor: 'mastercard-ember', description: 'Mastercard Worldwide' },
    { id: 'other', name: 'Diğer', shortLabel: 'KART', defaultColor: 'indigo', description: 'Standart Ödeme Kartı' },
];

export interface CardColorTheme {
    id: string;
    name: string;
    network?: CardNetwork;
    bg: string;
    border: string;
    text: string;
    accent: string;
}

export const NETWORK_THEMES: Record<string, CardColorTheme> = {
    // Troy - signature cyan, teal and deep marine
    'troy-cyan': {
        id: 'troy-cyan',
        name: 'Troy Turkuaz',
        network: 'troy',
        bg: 'linear-gradient(135deg, #0e7490 0%, #115e59 50%, #042f2e 100%)',
        border: '#14b8a6',
        text: '#ffffff',
        accent: '#2dd4bf',
    },
    'troy-marine': {
        id: 'troy-marine',
        name: 'Troy Okyanus',
        network: 'troy',
        bg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #082f49 100%)',
        border: '#0ea5e9',
        text: '#ffffff',
        accent: '#38bdf8',
    },
    'troy-midnight': {
        id: 'troy-midnight',
        name: 'Troy Gece Mavisi',
        network: 'troy',
        bg: 'linear-gradient(135deg, #0f766e 0%, #0f172a 100%)',
        border: '#2dd4bf',
        text: '#ffffff',
        accent: '#5eead4',
    },

    // Mastercard - signature ember red, obsidian charcoal and ruby
    'mastercard-ember': {
        id: 'mastercard-ember',
        name: 'Mastercard Köz',
        network: 'mastercard',
        bg: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 40%, #1c1917 100%)',
        border: '#f59e0b',
        text: '#ffffff',
        accent: '#f97316',
    },
    'mastercard-obsidian': {
        id: 'mastercard-obsidian',
        name: 'Mastercard Obsidian',
        network: 'mastercard',
        bg: 'linear-gradient(135deg, #262626 0%, #171717 60%, #450a0a 100%)',
        border: '#ef4444',
        text: '#ffffff',
        accent: '#fbbf24',
    },
    'mastercard-ruby': {
        id: 'mastercard-ruby',
        name: 'Mastercard Yakut',
        network: 'mastercard',
        bg: 'linear-gradient(135deg, #991b1b 0%, #581c87 100%)',
        border: '#fb7185',
        text: '#ffffff',
        accent: '#f43f5e',
    },

    // Visa - royal cobalt, gold navy and classic blue
    'visa-royal': {
        id: 'visa-royal',
        name: 'Visa Asil Mavi',
        network: 'visa',
        bg: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 50%, #0f172a 100%)',
        border: '#3b82f6',
        text: '#ffffff',
        accent: '#60a5fa',
    },
    'visa-gold': {
        id: 'visa-gold',
        name: 'Visa Altın Lacivert',
        network: 'visa',
        bg: 'linear-gradient(135deg, #1e40af 0%, #172554 60%, #78350f 100%)',
        border: '#f59e0b',
        text: '#ffffff',
        accent: '#fbbf24',
    },
    'visa-classic': {
        id: 'visa-classic',
        name: 'Visa Klasik',
        network: 'visa',
        bg: 'linear-gradient(135deg, #2563eb 0%, #1e1b4b 100%)',
        border: '#60a5fa',
        text: '#ffffff',
        accent: '#93c5fd',
    },

    // Generic presets
    'indigo': {
        id: 'indigo',
        name: 'İndigo',
        network: 'other',
        bg: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
        border: '#6366f1',
        text: '#ffffff',
        accent: '#818cf8',
    },
    'emerald': {
        id: 'emerald',
        name: 'Zümrüt',
        network: 'other',
        bg: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
        border: '#10b981',
        text: '#ffffff',
        accent: '#34d399',
    },
    'blue': {
        id: 'blue',
        name: 'Okyanus',
        network: 'other',
        bg: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)',
        border: '#38bdf8',
        text: '#ffffff',
        accent: '#7dd3fc',
    },
    'purple': {
        id: 'purple',
        name: 'Mor',
        network: 'other',
        bg: 'linear-gradient(135deg, #9333ea 0%, #581c87 100%)',
        border: '#c084fc',
        text: '#ffffff',
        accent: '#d8b4fe',
    },
    'rose': {
        id: 'rose',
        name: 'Gül Kurusu',
        network: 'other',
        bg: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
        border: '#fb7185',
        text: '#ffffff',
        accent: '#fda4af',
    },
    'amber': {
        id: 'amber',
        name: 'Altın',
        network: 'other',
        bg: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
        border: '#f59e0b',
        text: '#ffffff',
        accent: '#fcd34d',
    },
    'slate': {
        id: 'slate',
        name: 'Koyu Grafit',
        network: 'other',
        bg: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
        border: '#64748b',
        text: '#ffffff',
        accent: '#94a3b8',
    },
};

/**
 * Returns a list of colors recommended for a specific network (or all if not specified).
 */
export function getColorsForNetwork(network?: CardNetwork): CardColorTheme[] {
    const all = Object.values(NETWORK_THEMES);
    if (!network || network === 'other') {
        return all;
    }
    const networkMatches = all.filter(c => c.network === network);
    const others = all.filter(c => c.network !== network);
    return [...networkMatches, ...others];
}

/**
 * Gets the color theme configuration for a card. Fallbacks to network default, then indigo.
 */
export function getCardColorTheme(colorId?: string | null, network?: CardNetwork | null): CardColorTheme {
    if (colorId && NETWORK_THEMES[colorId]) {
        return NETWORK_THEMES[colorId];
    }
    if (network) {
        const netDef = CARD_NETWORKS.find(n => n.id === network);
        if (netDef && NETWORK_THEMES[netDef.defaultColor]) {
            return NETWORK_THEMES[netDef.defaultColor];
        }
    }
    return NETWORK_THEMES['indigo'];
}

/**
 * Detects the card payment network from raw input text (card name, bank name, etc.).
 */
export function detectCardNetwork(text: string): CardNetwork {
    if (!text) return 'other';
    const lower = text.toLowerCase();

    // Check Troy (handles 'troy', 'ltroy')
    if (/\b(troy|ltroy)\b/i.test(lower) || /l?troy/i.test(lower)) {
        return 'troy';
    }

    // Check Mastercard (handles 'mastercard', 'master card', 'master-card')
    if (/\b(mastercard|master\s*card)\b/i.test(lower)) {
        return 'mastercard';
    }

    // Check Visa (handles 'visa')
    if (/\bvisa\b/i.test(lower)) {
        return 'visa';
    }

    return 'other';
}

/**
 * Cleans the card name by stripping network keywords and trailing punctuation/hyphens,
 * and identifies the detected network.
 * Example: "Bankkart Gold Troy" -> cleanName: "Bankkart Gold", network: "troy"
 * Example: "Axess God lTroy" -> cleanName: "Axess God", network: "troy"
 * Example: "Bonus Flexi Mastercard" -> cleanName: "Bonus Flexi", network: "mastercard"
 * Example: "Tercih Express Visa" -> cleanName: "Tercih Express", network: "visa"
 */
export function cleanCardName(rawName: string): { cleanName: string; detectedNetwork: CardNetwork } {
    if (!rawName) {
        return { cleanName: '', detectedNetwork: 'other' };
    }

    const detectedNetwork = detectCardNetwork(rawName);

    // Regex to match network words and surrounding brackets or punctuation
    const networkRegex = /[\(\[\{-]?\s*\b(l?troy|master\s*card|mastercard|visa)\b\s*[\)\]\}]?/gi;

    let cleaned = rawName
        .replace(networkRegex, ' ')
        // Remove trailing or leading hyphens, slashes, or pipes
        .replace(/^[\s\-_/|]+|[\s\-_/|]+$/g, '')
        // Collapse multiple spaces into one
        .replace(/\s{2,}/g, ' ')
        .trim();

    // If string becomes completely empty (user entered only "Troy" or "Visa"), keep original or fallback
    if (!cleaned) {
        cleaned = rawName.trim();
    }

    return {
        cleanName: cleaned,
        detectedNetwork,
    };
}
