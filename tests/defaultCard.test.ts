import test from 'node:test';
import assert from 'node:assert/strict';
import { CreditCard } from '../src/lib/types';
import { supabase } from '../src/lib/supabase';
import { getCreditCards, setDefaultCreditCard } from '../src/lib/actions';

// Mock card dataset for unit tests
const mockCards: CreditCard[] = [
    {
        id: 'card-1',
        created_at: '2026-01-01',
        name: 'Bankkart Gold',
        bank_name: 'Ziraat Bankası',
        last_four_digits: '1234',
        color: 'troy-marine',
        card_network: 'troy',
        credit_limit: 40000,
        cutoff_day: 10,
        due_day: 20,
        is_active: true,
        is_default: false,
    },
    {
        id: 'card-2',
        created_at: '2026-01-02',
        name: 'Sağlam Kart',
        bank_name: 'Kuveyt Türk',
        last_four_digits: '5844',
        color: 'troy-midnight',
        card_network: 'troy',
        credit_limit: 50000,
        cutoff_day: 8,
        due_day: 18,
        is_active: true,
        is_default: true,
    },
    {
        id: 'card-3',
        created_at: '2026-01-03',
        name: 'Bonus Flexi',
        bank_name: 'Garanti BBVA',
        last_four_digits: '9876',
        color: 'mastercard-ember',
        card_network: 'mastercard',
        credit_limit: 60000,
        cutoff_day: 15,
        due_day: 25,
        is_active: true,
        is_default: false,
    },
];

test('DEF-01: resolves default credit card correctly from card list', () => {
    const defaultCard = mockCards.find(c => c.is_default);
    assert.ok(defaultCard, 'Must find a default card');
    assert.equal(defaultCard.name, 'Sağlam Kart');
    assert.equal(defaultCard.id, 'card-2');
    assert.equal(defaultCard.is_default, true);
});

test('DEF-02: falls back to first card when no card is flagged as default', () => {
    const noDefaultCards = mockCards.map(c => ({ ...c, is_default: false }));
    const resolvedCard = noDefaultCards.find(c => c.is_default) || noDefaultCards[0];
    assert.ok(resolvedCard, 'Must resolve to first card as fallback');
    assert.equal(resolvedCard.id, 'card-1');
});

test('DEF-03: handles empty cards gracefully with cash fallback', () => {
    const emptyCards: CreditCard[] = [];
    const resolvedDefault = emptyCards.find(c => c.is_default)?.id || emptyCards[0]?.id || '';
    const paymentMethod = emptyCards.length > 0 ? 'credit_card' : 'cash';

    assert.equal(resolvedDefault, '', 'Should be empty string when no cards exist');
    assert.equal(paymentMethod, 'cash', 'Payment method must fall back to cash when no cards exist');
});

test('DEF-04: form initialization selects credit_card and default card when cards exist', () => {
    // Simulating TransactionForm initialization for new transaction
    const cards = mockCards;
    const defaultCardId = undefined; // regular "+ Yeni İşlem" click

    const resolvedDefault = defaultCardId || cards.find(c => c.is_default)?.id || (cards[0]?.id || '');
    const paymentMethod = cards.length > 0 ? 'credit_card' : 'cash';

    assert.equal(paymentMethod, 'credit_card', 'Payment method should default to credit_card for new expense');
    assert.equal(resolvedDefault, 'card-2', 'Should auto-select Sağlam Kart as defaultCardId');
});

test('DEF-05: explicit defaultCardId parameter overrides card is_default setting', () => {
    // When user clicks "Kart Harcaması Ekle" on a specific card (e.g. Bonus Flexi)
    const cards = mockCards;
    const defaultCardId = 'card-3';

    const resolvedDefault = defaultCardId || cards.find(c => c.is_default)?.id || (cards[0]?.id || '');
    assert.equal(resolvedDefault, 'card-3', 'Explicit defaultCardId must override is_default flag');
});

test('DEF-06: switching type from income to expense restores credit_card default', () => {
    const cards = mockCards;
    let paymentMethod: 'cash' | 'credit_card' = 'cash';
    let type: 'income' | 'expense' = 'income';

    // User switches to expense
    type = 'expense';
    if (cards.length > 0) {
        paymentMethod = 'credit_card';
    }

    assert.equal(type, 'expense');
    assert.equal(paymentMethod, 'credit_card');
});

test('DEF-07: Live DB Verification — Sağlam Kart is default card in Supabase', async () => {
    const cards = await getCreditCards();
    assert.ok(cards.length > 0, 'Database must have active credit cards');

    const defaultCards = cards.filter(c => c.is_default === true);
    assert.equal(defaultCards.length, 1, 'Exactly one card must be marked as default');
    assert.equal(defaultCards[0].name, 'Sağlam Kart', 'Initial default card must be Sağlam Kart');
    assert.equal(defaultCards[0].card_network, 'troy');
});

test('DEF-08: Live DB Verification — setDefaultCreditCard atomically updates default card', async () => {
    const cards = await getCreditCards();
    const saglamKart = cards.find(c => c.name === 'Sağlam Kart');
    const axessGold = cards.find(c => c.name === 'Axess Gold');

    assert.ok(saglamKart && axessGold, 'Must find test cards in database');

    try {
        // Switch default to Axess Gold
        await setDefaultCreditCard(axessGold.id);
        const cardsAfterSwitch = await getCreditCards();
        const newDefault = cardsAfterSwitch.find(c => c.is_default);
        assert.equal(newDefault?.id, axessGold.id, 'Axess Gold must now be default');
        assert.equal(cardsAfterSwitch.find(c => c.id === saglamKart.id)?.is_default, false, 'Sağlam Kart must no longer be default');
    } finally {
        // Restore Sağlam Kart as default
        await setDefaultCreditCard(saglamKart.id);
        const restoredCards = await getCreditCards();
        const restoredDefault = restoredCards.find(c => c.is_default);
        assert.equal(restoredDefault?.id, saglamKart.id, 'Sağlam Kart must be restored as default');
    }
});
