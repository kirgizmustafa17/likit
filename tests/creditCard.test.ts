import test from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateCardCutoffAndDueDate,
    calculateNextCardCycle,
    getNextDateForDay,
    generateUUID,
    distributeInstallmentAmounts,
    calculateInstallmentDueDates,
    calculateInstallmentCutoffDates,
    generateCreditCardInstallments,
    computeCardSummaries,
    getDaysInMonth,
} from '../src/lib/creditCardUtils.ts';
import { CreditCard, Transaction } from '../src/lib/types.ts';
import { calculateDailyBalances } from '../src/lib/utils.ts';

test('getDaysInMonth returns correct days for normal, leap, and 30-day months', () => {
    assert.strictEqual(getDaysInMonth(2026, 1), 31); // Jan
    assert.strictEqual(getDaysInMonth(2026, 2), 28); // Feb non-leap
    assert.strictEqual(getDaysInMonth(2028, 2), 29); // Feb leap year
    assert.strictEqual(getDaysInMonth(2026, 4), 30); // Apr
    assert.strictEqual(getDaysInMonth(2026, 12), 31); // Dec
});

test('calculateCardCutoffAndDueDate: purchase before cutoff with due_day > cutoff_day', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    const result = calculateCardCutoffAndDueDate(card, '2026-05-10');
    assert.deepStrictEqual(result, {
        cutoffDate: '2026-05-15',
        dueDate: '2026-05-25',
    });
});

test('calculateCardCutoffAndDueDate: purchase after cutoff with due_day > cutoff_day', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    const result = calculateCardCutoffAndDueDate(card, '2026-05-16');
    assert.deepStrictEqual(result, {
        cutoffDate: '2026-06-15',
        dueDate: '2026-06-25',
    });
});

test('calculateCardCutoffAndDueDate: purchase on exact cutoff day', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    const result = calculateCardCutoffAndDueDate(card, '2026-05-15');
    assert.deepStrictEqual(result, {
        cutoffDate: '2026-05-15',
        dueDate: '2026-05-25',
    });
});

test('calculateCardCutoffAndDueDate: user case 11 November -> 23 November (Saturday shifted to Monday)', () => {
    const card = { cutoff_day: 11, due_day: 25 };
    const result = calculateCardCutoffAndDueDate(card, '2026-11-05');
    assert.deepStrictEqual(result, {
        cutoffDate: '2026-11-11',
        dueDate: '2026-11-23', // 11 Nov + 10 days = 21 Nov (Saturday) -> shifted to 23 Nov (Monday)
    });
});

test('calculateCardCutoffAndDueDate: due date automatically calculated (+10 days & weekday adjustment)', () => {
    const card = { cutoff_day: 25, due_day: 5 };
    // Purchase before cutoff: Cutoff 25 May -> 25 May + 10 days = 4 June (Thursday)
    const res1 = calculateCardCutoffAndDueDate(card, '2026-05-10');
    assert.deepStrictEqual(res1, {
        cutoffDate: '2026-05-25',
        dueDate: '2026-06-04',
    });

    // Purchase after cutoff: Cutoff 25 June -> 25 June + 10 days = 5 July (Sunday) -> shifted to 6 July (Monday)
    const res2 = calculateCardCutoffAndDueDate(card, '2026-05-26');
    assert.deepStrictEqual(res2, {
        cutoffDate: '2026-06-25',
        dueDate: '2026-07-06',
    });
});

test('calculateCardCutoffAndDueDate: year boundary rollover (December to January)', () => {
    const card = { cutoff_day: 20, due_day: 30 };
    // Purchase after cutoff in December: Cutoff 20 Jan 2027 -> 20 Jan + 10 days = 30 Jan (Saturday) -> shifted to 1 Feb (Monday)
    const result = calculateCardCutoffAndDueDate(card, '2026-12-25');
    assert.deepStrictEqual(result, {
        cutoffDate: '2027-01-20',
        dueDate: '2027-02-01',
    });
});

test('calculateCardCutoffAndDueDate: clamping to month-end (31st cutoff in Feb)', () => {
    const card = { cutoff_day: 31, due_day: 10 }; // due_day <= cutoff_day
    // Purchase in January before cutoff
    const resJan = calculateCardCutoffAndDueDate(card, '2026-01-10');
    assert.deepStrictEqual(resJan, {
        cutoffDate: '2026-01-31',
        dueDate: '2026-02-10',
    });

    // Purchase in January on exact cutoff day (Jan 31)
    const resOnJanCutoff = calculateCardCutoffAndDueDate(card, '2026-01-31');
    assert.deepStrictEqual(resOnJanCutoff, {
        cutoffDate: '2026-01-31',
        dueDate: '2026-02-10',
    });

    // Purchase in February
    const resFeb = calculateCardCutoffAndDueDate(card, '2026-02-05');
    assert.deepStrictEqual(resFeb, {
        cutoffDate: '2026-02-28', // Clamped to 28 days!
        dueDate: '2026-03-10',
    });
});

test('distributeInstallmentAmounts: single payment returns exact amount', () => {
    const result = distributeInstallmentAmounts(500, 1);
    assert.deepStrictEqual(result, [500]);
});

test('distributeInstallmentAmounts: 1000 TL in 3 installments preserves cents', () => {
    const result = distributeInstallmentAmounts(1000, 3);
    assert.deepStrictEqual(result, [333.34, 333.33, 333.33]);
    const sum = result.reduce((a, b) => a + b, 0);
    assert.strictEqual(Number(sum.toFixed(2)), 1000);
});

test('distributeInstallmentAmounts: 100 TL in 6 installments preserves cents', () => {
    const result = distributeInstallmentAmounts(100, 6);
    // 10000 cents / 6 = 1666 cents (16.66 TL) with remainder 4 cents
    assert.deepStrictEqual(result, [16.67, 16.67, 16.67, 16.67, 16.66, 16.66]);
    const sum = result.reduce((a, b) => a + b, 0);
    assert.strictEqual(Number(sum.toFixed(2)), 100);
});

test('calculateInstallmentDueDates: generates monthly sequential due dates with weekday adjustment', () => {
    const card = { cutoff_day: 20, due_day: 30 };
    const dates = calculateInstallmentDueDates(card, '2026-05-10', 4);
    assert.deepStrictEqual(dates, [
        '2026-06-01', // May 20 + 10 = May 30 (Sat) -> June 1 (Mon)
        '2026-06-30', // June 20 + 10 = June 30 (Tue)
        '2026-07-30', // July 20 + 10 = July 30 (Thu)
        '2026-08-31', // Aug 20 + 10 = Aug 30 (Sun) -> Aug 31 (Mon)
    ]);
});

test('calculateInstallmentDueDates: handles 31st cutoff day across short months', () => {
    const card = { cutoff_day: 31, due_day: 31 };
    const dates = calculateInstallmentDueDates(card, '2026-01-10', 4);
    assert.deepStrictEqual(dates, [
        '2026-02-10', // Jan 31 + 10 = Feb 10 (Tue)
        '2026-03-10', // Feb 28 + 10 = Mar 10 (Tue)
        '2026-04-10', // Mar 31 + 10 = Apr 10 (Fri)
        '2026-05-11', // Apr 30 + 10 = May 10 (Sun) -> May 11 (Mon)
    ]);
});

test('generateCreditCardInstallments creates correct transaction objects', () => {
    const mockCard: CreditCard = {
        id: 'card-123',
        created_at: '2026-01-01',
        name: 'Bonus',
        color: 'emerald',
        credit_limit: 50000,
        cutoff_day: 15,
        due_day: 25,
        is_active: true,
    };

    const installments = generateCreditCardInstallments({
        title: 'Buzdolabı',
        totalAmount: 15000,
        purchaseDate: '2026-05-10',
        totalInstallments: 3,
        card: mockCard,
        parentTransactionId: 'parent-group-1',
    });

    assert.strictEqual(installments.length, 3);
    assert.strictEqual(installments[0].title, 'Buzdolabı (1/3)');
    assert.strictEqual(installments[0].amount, 5000);
    assert.strictEqual(installments[0].transaction_date, '2026-05-15'); // Cash flow hits on cutoff date
    assert.strictEqual(installments[0].due_date, '2026-05-25');         // Official bank due date (May 25 Mon)
    assert.strictEqual(installments[0].purchase_date, '2026-05-10');
    assert.strictEqual(installments[0].card_id, 'card-123');
    assert.strictEqual(installments[0].installment_no, 1);
    assert.strictEqual(installments[0].total_installments, 3);
    assert.strictEqual(installments[0].parent_transaction_id, 'parent-group-1');

    assert.strictEqual(installments[1].title, 'Buzdolabı (2/3)');
    assert.strictEqual(installments[1].transaction_date, '2026-06-15');
    assert.strictEqual(installments[1].due_date, '2026-06-25');         // June 25 Thu

    assert.strictEqual(installments[2].title, 'Buzdolabı (3/3)');
    assert.strictEqual(installments[2].transaction_date, '2026-07-15');
    assert.strictEqual(installments[2].due_date, '2026-07-27');         // July 15 + 10 = July 25 (Sat) -> July 27 (Mon)
});

test('computeCardSummaries aggregates debt and available limit correctly', () => {
    const mockCard: CreditCard = {
        id: 'card-1',
        created_at: '2026-01-01',
        name: 'Maximum',
        color: 'indigo',
        credit_limit: 30000,
        cutoff_day: 20,
        due_day: 30,
        is_active: true,
    };

    const mockTransactions: Transaction[] = [
        // Pending transaction on card-1: 3000
        {
            id: 't-1',
            created_at: '2026-05-01',
            title: 'Market',
            amount: 3000,
            transaction_date: '2026-05-30',
            is_completed: false,
            type: 'expense',
            card_id: 'card-1',
        },
        // Completed transaction on card-1: 2000 (should NOT count toward current debt)
        {
            id: 't-2',
            created_at: '2026-04-01',
            title: 'Eski Harcama',
            amount: 2000,
            transaction_date: '2026-04-30',
            is_completed: true,
            completed_amount: 2000,
            completed_date: '2026-04-29',
            type: 'expense',
            card_id: 'card-1',
        },
        // Transaction on another card
        {
            id: 't-3',
            created_at: '2026-05-01',
            title: 'Başka Kart',
            amount: 5000,
            transaction_date: '2026-05-30',
            is_completed: false,
            type: 'expense',
            card_id: 'card-other',
        },
    ];

    const summaries = computeCardSummaries([mockCard], mockTransactions, '2026-05-15');
    assert.strictEqual(summaries.length, 1);
    const summary = summaries[0];
    assert.strictEqual(summary.current_debt, 3000);
    assert.strictEqual(summary.available_limit, 27000);
    assert.strictEqual(summary.pending_transactions_count, 1);
    assert.strictEqual(summary.next_cutoff_date, '2026-05-20');
    assert.strictEqual(summary.next_due_date, '2026-06-01'); // May 20 + 10 = May 30 (Sat) -> June 1 (Mon)
});

test('computeCardSummaries: handles debt exceeding limit by clamping available_limit to 0', () => {
    const card: CreditCard = {
        id: 'card-over',
        created_at: '2026-01-01',
        name: 'Over Limit Card',
        color: 'rose',
        credit_limit: 1000,
        cutoff_day: 10,
        due_day: 20,
        is_active: true,
    };
    const txns: Transaction[] = [
        {
            id: 't-1',
            created_at: '2026-05-01',
            title: 'Büyük Harcama',
            amount: 2500,
            transaction_date: '2026-05-20',
            is_completed: false,
            type: 'expense',
            card_id: 'card-over',
        },
    ];
    const summaries = computeCardSummaries([card], txns);
    assert.strictEqual(summaries[0].current_debt, 2500);
    assert.strictEqual(summaries[0].available_limit, 0); // Not negative
});

test('computeCardSummaries: handles empty card or empty transactions', () => {
    assert.deepStrictEqual(computeCardSummaries([], []), []);
    const card: CreditCard = {
        id: 'c-1',
        created_at: '2026-01-01',
        name: 'Test',
        color: 'blue',
        credit_limit: 5000,
        cutoff_day: 5,
        due_day: 15,
        is_active: true,
    };
    const summaries = computeCardSummaries([card], []);
    assert.strictEqual(summaries[0].current_debt, 0);
    assert.strictEqual(summaries[0].available_limit, 5000);
    assert.strictEqual(summaries[0].pending_transactions_count, 0);
});

test('generateCreditCardInstallments: auto-generates parent_transaction_id if omitted', () => {
    const card: CreditCard = {
        id: 'card-1',
        created_at: '2026-01-01',
        name: 'Test Card',
        color: 'indigo',
        credit_limit: 10000,
        cutoff_day: 10,
        due_day: 20,
        is_active: true,
    };
    const res = generateCreditCardInstallments({
        title: 'Harcama',
        totalAmount: 500,
        purchaseDate: '2026-05-05',
        totalInstallments: 2,
        card,
    });
    assert.strictEqual(res.length, 2);
    assert.ok(res[0].parent_transaction_id);
    assert.strictEqual(res[0].parent_transaction_id, res[1].parent_transaction_id);
});

test('calculateInstallmentDueDates: 12 installments rolling over into next year', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    const dates = calculateInstallmentDueDates(card, '2026-11-10', 12);
    assert.strictEqual(dates.length, 12);
    assert.strictEqual(dates[0], '2026-11-25');
    assert.strictEqual(dates[1], '2026-12-25');
    assert.strictEqual(dates[2], '2027-01-25');
    assert.strictEqual(dates[11], '2027-10-25');
});

test('distributeInstallmentAmounts: distributes single-cent fractions accurately', () => {
    const result = distributeInstallmentAmounts(0.01, 2);
    assert.deepStrictEqual(result, [0.01, 0.00]);
    assert.strictEqual(Number((result[0] + result[1]).toFixed(2)), 0.01);

    const res7 = distributeInstallmentAmounts(1000, 7);
    assert.strictEqual(res7.length, 7);
    const sum7 = res7.reduce((a, b) => a + b, 0);
    assert.strictEqual(Number(sum7.toFixed(2)), 1000);
});

test('getNextDateForDay: returns date in current month when targetDay >= today', () => {
    // Today is May 10, target is 15th
    assert.strictEqual(getNextDateForDay(15, '2026-05-10'), '2026-05-15');
    // Today is May 15, target is 15th (exact day)
    assert.strictEqual(getNextDateForDay(15, '2026-05-15'), '2026-05-15');
});

test('getNextDateForDay: advances to next month when targetDay < today', () => {
    // Today is May 16, target is 15th -> should be June 15
    assert.strictEqual(getNextDateForDay(15, '2026-05-16'), '2026-06-15');
    // Today is May 28, target is 5th -> should be June 5
    assert.strictEqual(getNextDateForDay(5, '2026-05-28'), '2026-06-05');
});

test('getNextDateForDay: clamps to month maximum (31st target in Feb and Apr)', () => {
    // Today is Jan 10, target is 31st -> Jan 31
    assert.strictEqual(getNextDateForDay(31, '2026-01-10'), '2026-01-31');
    // Today is Feb 5, target is 31st -> Feb 28 (clamped)
    assert.strictEqual(getNextDateForDay(31, '2026-02-05'), '2026-02-28');
    // Leap year 2028: Feb 5, target 31st -> Feb 29
    assert.strictEqual(getNextDateForDay(31, '2028-02-05'), '2028-02-29');
    // Today is Mar 31 (exact), target is 31st -> Mar 31
    assert.strictEqual(getNextDateForDay(31, '2026-03-31'), '2026-03-31');
    // Today is Apr 5, target is 31st -> Apr 30 (clamped)
    assert.strictEqual(getNextDateForDay(31, '2026-04-05'), '2026-04-30');
});

test('getNextDateForDay: rolls over December to January of next year', () => {
    // Today is Dec 20, target is 15th -> Jan 15 of next year
    assert.strictEqual(getNextDateForDay(15, '2026-12-20'), '2027-01-15');
});

test('calculateNextCardCycle: correctly tracks upcoming due date when cutoff has passed', () => {
    // Cutoff is 15th, Due date is 25th
    const card = { cutoff_day: 15, due_day: 25 };

    // Case 1: Today is May 10 (before cutoff) -> both cutoff and due date in May
    const cycle1 = calculateNextCardCycle(card, '2026-05-10');
    assert.strictEqual(cycle1.nextCutoffDate, '2026-05-15');
    assert.strictEqual(cycle1.nextDueDate, '2026-05-25');

    // Case 2: Today is May 18 (AFTER cutoff, but BEFORE due date!)
    // The previous implementation mistakenly advanced due date to June 25, skipping May 25!
    const cycle2 = calculateNextCardCycle(card, '2026-05-18');
    assert.strictEqual(cycle2.nextCutoffDate, '2026-06-15', 'Cutoff should advance to June');
    assert.strictEqual(cycle2.nextDueDate, '2026-05-25', 'Due date MUST remain May 25 because it has not arrived yet!');

    // Case 3: Today is May 26 (after due date as well) -> both in June
    const cycle3 = calculateNextCardCycle(card, '2026-05-26');
    assert.strictEqual(cycle3.nextCutoffDate, '2026-06-15');
    assert.strictEqual(cycle3.nextDueDate, '2026-06-25');
});

test('calculateNextCardCycle: handles cutoff passed and checks upcoming due date', () => {
    // Cutoff on 25th -> 25 May + 10 days = 4 June (Thursday)
    const card = { cutoff_day: 25, due_day: 5 };

    // Today is May 28: May 25 cutoff passed, upcoming bill is due on June 4
    const cycle = calculateNextCardCycle(card, '2026-05-28');
    assert.strictEqual(cycle.nextCutoffDate, '2026-06-25');
    assert.strictEqual(cycle.nextDueDate, '2026-06-04');
});

test('generateUUID: produces valid RFC 4122 v4 UUID strings', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (let i = 0; i < 10; i++) {
        const id = generateUUID();
        assert.match(id, uuidRegex, `Expected valid UUID v4, got: ${id}`);
    }
});

test('computeCardSummaries: refund/income transactions reduce card debt', () => {
    const card: CreditCard = {
        id: 'card-refund',
        created_at: '2026-01-01',
        name: 'Bonus',
        color: 'indigo',
        credit_limit: 10000,
        cutoff_day: 15,
        due_day: 25,
        is_active: true,
    };

    const transactions: Transaction[] = [
        // 3000 expense
        {
            id: 't-1',
            created_at: '2026-05-01',
            title: 'Alışveriş',
            amount: 3000,
            transaction_date: '2026-05-25',
            is_completed: false,
            type: 'expense',
            card_id: 'card-refund',
        },
        // 500 refund/iade
        {
            id: 't-2',
            created_at: '2026-05-02',
            title: 'Ürün İadesi',
            amount: 500,
            transaction_date: '2026-05-25',
            is_completed: false,
            type: 'income',
            card_id: 'card-refund',
        },
    ];

    const summaries = computeCardSummaries([card], transactions, '2026-05-10');
    // Debt should be 3000 - 500 = 2500, NOT 3500!
    assert.strictEqual(summaries[0].current_debt, 2500);
    assert.strictEqual(summaries[0].available_limit, 7500);
});

test('calculateInstallmentDueDates: correctly isolates index k-1 for installment k during editing', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    const purchaseDate = '2026-05-10';
    const totalInstallments = 3;

    const allDates = calculateInstallmentDueDates(card, purchaseDate, totalInstallments);
    assert.strictEqual(allDates.length, 3);
    assert.strictEqual(allDates[0], '2026-05-25'); // May 15 + 10 = May 25 (Mon)
    assert.strictEqual(allDates[1], '2026-06-25'); // June 15 + 10 = June 25 (Thu)
    assert.strictEqual(allDates[2], '2026-07-27'); // July 15 + 10 = July 25 (Sat) -> July 27 (Mon)

    // Editing installment 2 should use index 1 -> '2026-06-25', never falling back to installment 1
    const installment2No = 2;
    const editingDueDate = allDates[installment2No - 1];
    assert.strictEqual(editingDueDate, '2026-06-25');
});

test('calculateInstallmentDueDates: 12 installments starting in December after cutoff roll into next year', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    // Purchase on Dec 20 (after cutoff on Dec 15) -> 1st cutoff is Jan 15, 2027; 1st due is Jan 25, 2027
    const dates = calculateInstallmentDueDates(card, '2026-12-20', 12);
    assert.strictEqual(dates.length, 12);
    assert.strictEqual(dates[0], '2027-01-25');
    assert.strictEqual(dates[1], '2027-02-25');
    assert.strictEqual(dates[2], '2027-03-25');
    assert.strictEqual(dates[11], '2027-12-27'); // Dec 25, 2027 is Saturday -> Dec 27 (Mon)
});

test('calculateInstallmentDueDates: 12 installments starting in December before cutoff', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    // Purchase on Dec 10 (before cutoff on Dec 15) -> 1st due is Dec 25, 2026
    const dates = calculateInstallmentDueDates(card, '2026-12-10', 12);
    assert.strictEqual(dates.length, 12);
    assert.strictEqual(dates[0], '2026-12-25');
    assert.strictEqual(dates[1], '2027-01-25');
    assert.strictEqual(dates[11], '2027-11-25');
});

test('calculateInstallmentCutoffDates: generates sequential statement cutoff dates', () => {
    const card = { cutoff_day: 15, due_day: 25 };
    const dates = calculateInstallmentCutoffDates(card, '2026-05-10', 3);
    assert.strictEqual(dates.length, 3);
    assert.strictEqual(dates[0], '2026-05-15');
    assert.strictEqual(dates[1], '2026-06-15');
    assert.strictEqual(dates[2], '2026-07-15');
});

test('cash flow daily balances: credit card installments affect balance on statement cutoff dates, not purchase date', () => {
    const mockCard: CreditCard = {
        id: 'card-cf',
        created_at: '2026-01-01',
        name: 'Bonus',
        color: 'emerald',
        credit_limit: 50000,
        cutoff_day: 15,
        due_day: 25,
        is_active: true,
    };

    // Income on May 1st: 10,000 TL
    const incomeTxn: Transaction = {
        id: 'inc-1',
        created_at: '2026-05-01',
        title: 'Maaş',
        amount: 10000,
        transaction_date: '2026-05-01',
        is_completed: true,
        completed_date: '2026-05-01',
        completed_amount: 10000,
        type: 'income',
    };

    // Multi-installment expense purchased on May 10th: 3,000 TL in 3 installments (1000 TL each on cutoff dates May 15, Jun 15, Jul 15)
    const installments = generateCreditCardInstallments({
        title: 'Telefon',
        totalAmount: 3000,
        purchaseDate: '2026-05-10',
        totalInstallments: 3,
        card: mockCard,
    });

    const allTxns: Transaction[] = [
        incomeTxn,
        ...installments.map((inst, idx) => ({
            ...inst,
            id: `inst-${idx + 1}`,
            created_at: '2026-05-10',
        })),
    ];

    // Chart from May 1 to May 30
    const start = new Date(2026, 4, 1); // May 1
    const end = new Date(2026, 4, 30);  // May 30
    const balances = calculateDailyBalances(allTxns, start, end);

    // On May 10 (purchase date), balance is STILL 10,000 because payment hits on cutoff date
    const may10 = balances.find((b: { date: string }) => b.date === '2026-05-10');
    assert.strictEqual(may10.balance, 10000);

    // On May 14 (day before cutoff date), balance is STILL 10,000
    const may14 = balances.find((b: { date: string }) => b.date === '2026-05-14');
    assert.strictEqual(may14.balance, 10000);

    // On May 15 (statement cutoff date of installment 1), balance drops by 1,000 to 9,000!
    const may15 = balances.find((b: { date: string }) => b.date === '2026-05-15');
    assert.strictEqual(may15.balance, 9000);

    // On May 25 (due date), balance is already deducted at cutoff, so it remains 9,000
    const may25 = balances.find((b: { date: string }) => b.date === '2026-05-25');
    assert.strictEqual(may25.balance, 9000);

    // On May 30, balance remains 9,000
    const may30 = balances.find((b: { date: string }) => b.date === '2026-05-30');
    assert.strictEqual(may30.balance, 9000);
});




