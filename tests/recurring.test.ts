import test from 'node:test';
import assert from 'node:assert/strict';
import { RecurringRule, CreditCard, Transaction } from '../src/lib/types';
import {
    clampDayToMonth,
    computeRecurringSummary,
    generateRecurringOccurrences,
    identifyMissingRecurringTransactions,
    getCategoryLabel,
    getCategoryIcon,
} from '../src/lib/recurringUtils';
import {
    addRecurringRule,
    getRecurringRules,
    updateRecurringRule,
    deleteRecurringRule,
    toggleRecurringRuleActive,
    getTransactions,
} from '../src/lib/actions';

test('clampDayToMonth: clamps 31st correctly across short and leap months', () => {
    // Normal February (e.g. 2025: 28 days)
    assert.equal(clampDayToMonth(2025, 2, 31), 28);
    // Leap February (e.g. 2028: 29 days)
    assert.equal(clampDayToMonth(2028, 2, 31), 29);
    // April (30 days)
    assert.equal(clampDayToMonth(2026, 4, 31), 30);
    // May (31 days)
    assert.equal(clampDayToMonth(2026, 5, 31), 31);
    // Normal day inside range (15th)
    assert.equal(clampDayToMonth(2026, 2, 15), 15);
});

test('computeRecurringSummary: calculates monthly income, expense and net disposable cash', () => {
    const rules: RecurringRule[] = [
        {
            id: '1',
            created_at: '',
            title: 'Maaş',
            amount: 60000,
            type: 'income',
            category: 'salary',
            day_of_month: 1,
            frequency: 'monthly',
            payment_method: 'cash',
            start_date: '2026-01-01',
            is_active: true,
        },
        {
            id: '2',
            created_at: '',
            title: 'Ek Gelir (Danışmanlık)',
            amount: 15000,
            type: 'income',
            category: 'extra_income',
            day_of_month: 15,
            frequency: 'monthly',
            payment_method: 'cash',
            start_date: '2026-01-01',
            is_active: true,
        },
        {
            id: '3',
            created_at: '',
            title: 'Ev Kirası',
            amount: 22000,
            type: 'expense',
            category: 'rent',
            day_of_month: 15,
            frequency: 'monthly',
            payment_method: 'cash',
            start_date: '2026-01-01',
            is_active: true,
        },
        {
            id: '4',
            created_at: '',
            title: 'Doğalgaz & Elektrik',
            amount: 3000,
            type: 'expense',
            category: 'bill',
            day_of_month: 20,
            frequency: 'monthly',
            payment_method: 'cash',
            start_date: '2026-01-01',
            is_active: true,
        },
        {
            id: '5',
            created_at: '',
            title: 'Pasif Eski Abonelik',
            amount: 500,
            type: 'expense',
            category: 'subscription',
            day_of_month: 5,
            frequency: 'monthly',
            payment_method: 'cash',
            start_date: '2026-01-01',
            is_active: false, // Inactive: should be ignored
        },
    ];

    const summary = computeRecurringSummary(rules);
    assert.equal(summary.total_monthly_income, 75000); // 60000 + 15000
    assert.equal(summary.total_monthly_expense, 25000); // 22000 + 3000
    assert.equal(summary.net_monthly_flow, 50000); // 75000 - 25000
    assert.equal(summary.active_rules_count, 4);
});

test('generateRecurringOccurrences: generates 12 monthly occurrences for salary on 1st', () => {
    const salaryRule: RecurringRule = {
        id: 'rule-salary',
        created_at: '',
        title: 'Maaş',
        amount: 65000,
        type: 'income',
        category: 'salary',
        day_of_month: 1,
        frequency: 'monthly',
        payment_method: 'cash',
        start_date: '2026-01-01',
        is_active: true,
    };

    const referenceDate = new Date('2026-01-01');
    const occurrences = generateRecurringOccurrences({
        rule: salaryRule,
        horizonMonths: 12,
        referenceDate,
    });

    assert.ok(occurrences.length >= 12, `Expected at least 12 occurrences, got ${occurrences.length}`);
    assert.equal(occurrences[0].transaction_date, '2026-01-01');
    assert.equal(occurrences[0].amount, 65000);
    assert.equal(occurrences[0].type, 'income');
    assert.equal(occurrences[0].recurring_rule_id, 'rule-salary');
    assert.equal(occurrences[1].transaction_date, '2026-02-01');
    assert.equal(occurrences[11].transaction_date, '2026-12-01');
});

test('generateRecurringOccurrences: clamps 31st day to month end in Feb and Apr', () => {
    const endOfMonthBill: RecurringRule = {
        id: 'rule-bill-31',
        created_at: '',
        title: 'Ay Sonu Faturası',
        amount: 1200,
        type: 'expense',
        category: 'bill',
        day_of_month: 31,
        frequency: 'monthly',
        payment_method: 'cash',
        start_date: '2026-01-01',
        is_active: true,
    };

    const referenceDate = new Date('2026-01-01');
    const occurrences = generateRecurringOccurrences({
        rule: endOfMonthBill,
        horizonMonths: 5,
        referenceDate,
    });

    // 2026-01-31 (Jan has 31)
    assert.equal(occurrences[0].transaction_date, '2026-01-31');
    // 2026-02-28 (Feb has 28 in 2026)
    assert.equal(occurrences[1].transaction_date, '2026-02-28');
    // 2026-03-31 (Mar has 31)
    assert.equal(occurrences[2].transaction_date, '2026-03-31');
    // 2026-04-30 (Apr has 30)
    assert.equal(occurrences[3].transaction_date, '2026-04-30');
});

test('generateRecurringOccurrences: integrates with credit card cutoff and due dates', () => {
    const card: CreditCard = {
        id: 'card-bonus',
        created_at: '',
        name: 'Bonus Kart',
        color: 'emerald',
        credit_limit: 50000,
        cutoff_day: 15,
        due_day: 25,
        is_active: true,
    };

    const netflixSubscription: RecurringRule = {
        id: 'rule-netflix',
        created_at: '',
        title: 'Netflix & Spotify',
        amount: 600,
        type: 'expense',
        category: 'subscription',
        day_of_month: 5, // Charged on the 5th
        frequency: 'monthly',
        payment_method: 'credit_card',
        card_id: 'card-bonus',
        start_date: '2026-05-01',
        is_active: true,
    };

    const occurrences = generateRecurringOccurrences({
        rule: netflixSubscription,
        cards: [card],
        horizonMonths: 2,
        referenceDate: new Date('2026-05-01'),
    });

    assert.ok(occurrences.length >= 2);
    const mayTx = occurrences[0];
    assert.equal(mayTx.card_id, 'card-bonus');
    assert.equal(mayTx.purchase_date, '2026-05-05');
    // Because purchase (May 5) is <= cutoff (May 15), cutoff date is 2026-05-15
    assert.equal(mayTx.transaction_date, '2026-05-15');
    // Due date = May 15 + 10 = May 25, 2026 (Monday -> weekday)
    assert.equal(mayTx.due_date, '2026-05-25');
});

test('identifyMissingRecurringTransactions: is completely idempotent', () => {
    const rule: RecurringRule = {
        id: 'rule-rent',
        created_at: '',
        title: 'Kira',
        amount: 18000,
        type: 'expense',
        category: 'rent',
        day_of_month: 15,
        frequency: 'monthly',
        payment_method: 'cash',
        start_date: '2026-01-01',
        is_active: true,
    };

    const referenceDate = new Date('2026-01-01');

    // 1. Initially no transactions exist -> all 13 (Jan 2026 to Jan 2027) missing
    const missingFirstRun = identifyMissingRecurringTransactions({
        rule,
        existingTransactions: [],
        horizonMonths: 3,
        referenceDate,
    });
    assert.equal(missingFirstRun.length, 4); // Jan, Feb, Mar, Apr

    // 2. Pretend Jan and Feb transactions are already saved
    const mockExisting: Transaction[] = [
        {
            id: 'tx-1',
            created_at: '',
            title: 'Kira',
            amount: 18000,
            transaction_date: '2026-01-15',
            is_completed: true,
            type: 'expense',
            recurring_rule_id: 'rule-rent',
        },
        {
            id: 'tx-2',
            created_at: '',
            title: 'Kira',
            amount: 18000,
            transaction_date: '2026-02-15',
            is_completed: false,
            type: 'expense',
            recurring_rule_id: 'rule-rent',
        },
    ];

    const missingSecondRun = identifyMissingRecurringTransactions({
        rule,
        existingTransactions: mockExisting,
        horizonMonths: 3,
        referenceDate,
    });

    // Only Mar and Apr should be missing!
    assert.equal(missingSecondRun.length, 2);
    assert.equal(missingSecondRun[0].transaction_date, '2026-03-15');
    assert.equal(missingSecondRun[1].transaction_date, '2026-04-15');
});

test('getCategoryLabel & getCategoryIcon return proper Turkish metadata', () => {
    assert.equal(getCategoryLabel('rent'), 'Kira');
    assert.equal(getCategoryIcon('rent'), '🏠');
    assert.equal(getCategoryLabel('salary'), 'Maaş');
    assert.equal(getCategoryIcon('salary'), '💼');
    assert.equal(getCategoryLabel('bill'), 'Fatura');
    assert.equal(getCategoryIcon('bill'), '⚡');
    assert.equal(getCategoryLabel('dues'), 'Aidat');
    assert.equal(getCategoryIcon('dues'), '🏢');
    assert.equal(getCategoryLabel('extra_income'), 'Ek Gelir');
    assert.equal(getCategoryIcon('extra_income'), '💰');
});

test('Supabase Live DB Integration: Full Recurring Rule lifecycle', async () => {
    // 1. Create a live recurring rule for test
    const { rule, createdTransactionsCount } = await addRecurringRule({
        title: 'Canli Test Ev Kirasi',
        amount: 25000,
        type: 'expense',
        category: 'rent',
        day_of_month: 15,
        frequency: 'monthly',
        payment_method: 'cash',
        start_date: '2026-01-01',
        is_active: true,
    });

    assert.ok(rule.id, 'Rule should be saved with an id');
    assert.equal(rule.title, 'Canli Test Ev Kirasi');
    assert.ok(createdTransactionsCount >= 12, 'Should create at least 12 projected occurrences');

    try {
        // 2. Fetch recurring rules from live DB and confirm
        const rules = await getRecurringRules();
        const found = rules.find((r) => r.id === rule.id);
        assert.ok(found, 'Created rule must exist in getRecurringRules()');
        assert.equal(Number(found?.amount), 25000);

        // 3. Confirm transactions exist in likit_transactions
        const allTxns = await getTransactions();
        const ruleTxns = allTxns.filter((t) => t.recurring_rule_id === rule.id);
        assert.ok(ruleTxns.length >= 12, `Expected at least 12 transactions, got ${ruleTxns.length}`);
        assert.equal(ruleTxns[0].title, 'Canli Test Ev Kirasi');

        // 4. Update the rule (e.g. rent increase: 25.000 -> 28.000)
        const updated = await updateRecurringRule(rule.id, {
            amount: 28000,
            title: 'Canli Test Ev Kirasi (Zamli)',
        });
        assert.equal(Number(updated.amount), 28000);

        // 5. Toggle rule active state
        const toggled = await toggleRecurringRuleActive(rule.id, false);
        assert.equal(toggled.is_active, false);

    } finally {
        // 6. Clean up: Delete rule and its generated transactions
        await deleteRecurringRule(rule.id, true);

        // Verify cleanup
        const postDeleteRules = await getRecurringRules();
        assert.ok(!postDeleteRules.some((r) => r.id === rule.id), 'Rule should be deleted');

        const postDeleteTxns = await getTransactions();
        assert.ok(!postDeleteTxns.some((t) => t.recurring_rule_id === rule.id), 'Generated txns should be removed');
    }
});
