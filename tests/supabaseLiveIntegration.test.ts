import test from 'node:test';
import assert from 'node:assert/strict';
import { supabase } from '../src/lib/supabase.ts';
import {
    addCreditCard,
    getCreditCards,
    deleteCreditCard,
    addCreditCardExpense,
    getTransactions,
    deleteTransactionGroup,
} from '../src/lib/actions.ts';

test('Supabase Live DB Integration: Credit Cards and Transactions flow', async () => {
    // 1. Create a test card
    const testCard = await addCreditCard({
        name: 'Otomasyon Canli Test Karti',
        bank_name: 'TestBank',
        last_four_digits: '9999',
        color: 'emerald',
        credit_limit: 75000,
        cutoff_day: 15,
        due_day: 25,
        is_active: true,
    });

    assert.ok(testCard.id, 'Test card must have an id');
    assert.equal(testCard.name, 'Otomasyon Canli Test Karti');
    assert.equal(Number(testCard.credit_limit), 75000);

    try {
        // 2. Fetch active credit cards and confirm test card exists
        const cards = await getCreditCards();
        const foundCard = cards.find((c) => c.id === testCard.id);
        assert.ok(foundCard, 'Created card should be listed in active cards');
        assert.equal(foundCard?.last_four_digits, '9999');

        // 3. Add 3-installment expense using the test card
        const installments = await addCreditCardExpense({
            title: 'Canli Test Taksitli Alisveris',
            totalAmount: 3000,
            purchaseDate: '2026-05-10',
            totalInstallments: 3,
            card: testCard,
        });

        assert.equal(installments.length, 3, 'Should create 3 installments');
        const parentId = installments[0].parent_transaction_id;
        assert.ok(parentId, 'Installment must have a parent_transaction_id');

        const expectedCutoffs = ['2026-05-15', '2026-06-15', '2026-07-15'];
        const expectedDues = ['2026-05-25', '2026-06-25', '2026-07-25'];

        installments.forEach((inst, index) => {
            assert.equal(inst.installment_no, index + 1);
            assert.equal(inst.total_installments, 3);
            assert.equal(inst.card_id, testCard.id);
            assert.equal(inst.parent_transaction_id, parentId);
            assert.equal(Number(inst.amount), 1000);
            assert.equal(inst.transaction_date, expectedCutoffs[index], 'Transaction date must be the cutoff date');
            assert.equal(inst.due_date, expectedDues[index], 'Due date must be preserved');
        });

        // 4. Fetch transactions and verify join with card
        const allTx = await getTransactions();
        const createdTx = allTx.filter((t) => t.parent_transaction_id === parentId);
        assert.equal(createdTx.length, 3, 'Should find all 3 created installments in DB');
        assert.ok(createdTx[0].card, 'Transaction should include joined credit card');
        assert.equal(createdTx[0].card?.name, 'Otomasyon Canli Test Karti');

        // 5. Delete transaction group
        await deleteTransactionGroup(parentId);
        const txAfterGroupDelete = await getTransactions();
        const remainingGroupTx = txAfterGroupDelete.filter((t) => t.parent_transaction_id === parentId);
        assert.equal(remainingGroupTx.length, 0, 'All installments in group should be deleted');

        // 6. Delete test credit card (soft delete)
        await deleteCreditCard(testCard.id);
        const cardsAfterDelete = await getCreditCards();
        const deletedCardListed = cardsAfterDelete.find((c) => c.id === testCard.id);
        assert.equal(deletedCardListed, undefined, 'Soft-deleted card should not appear in active cards');
    } finally {
        // Clean up: hard delete the test card to leave DB clean
        await supabase.from('likit_credit_cards').delete().eq('id', testCard.id);
    }
});
