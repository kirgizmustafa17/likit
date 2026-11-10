import test from 'node:test';
import assert from 'node:assert/strict';
import {
    detectCardNetwork,
    cleanCardName,
    getCardColorTheme,
    getColorsForNetwork,
    CARD_NETWORKS,
    NETWORK_THEMES,
} from '../src/lib/creditCardUtils.ts';

test('detectCardNetwork correctly identifies Troy, Visa, Mastercard, and fallback', () => {
    assert.strictEqual(detectCardNetwork('Bankkart Gold Troy'), 'troy');
    assert.strictEqual(detectCardNetwork('Axess God lTroy'), 'troy');
    assert.strictEqual(detectCardNetwork('Sağlam Kart Troy'), 'troy');
    assert.strictEqual(detectCardNetwork('troy kart'), 'troy');

    assert.strictEqual(detectCardNetwork('Tercih Express Visa'), 'visa');
    assert.strictEqual(detectCardNetwork('Hepsiburada World Visa'), 'visa');
    assert.strictEqual(detectCardNetwork('visa platinum'), 'visa');

    assert.strictEqual(detectCardNetwork('Enpara Mastercard'), 'mastercard');
    assert.strictEqual(detectCardNetwork('Bonus Flexi Mastercard'), 'mastercard');
    assert.strictEqual(detectCardNetwork('Master Card Gold'), 'mastercard');

    assert.strictEqual(detectCardNetwork('Genel Banka Kredi Kartı'), 'other');
    assert.strictEqual(detectCardNetwork(''), 'other');
});

test('cleanCardName strips network keywords cleanly from raw card names', () => {
    // Exact user cards
    const card1 = cleanCardName('Bankkart Gold Troy');
    assert.strictEqual(card1.cleanName, 'Bankkart Gold');
    assert.strictEqual(card1.detectedNetwork, 'troy');

    const card2 = cleanCardName('Axess God lTroy');
    assert.strictEqual(card2.cleanName, 'Axess God');
    assert.strictEqual(card2.detectedNetwork, 'troy');

    const card3 = cleanCardName('Tercih Express Visa');
    assert.strictEqual(card3.cleanName, 'Tercih Express');
    assert.strictEqual(card3.detectedNetwork, 'visa');

    const card4 = cleanCardName('Sağlam Kart Troy');
    assert.strictEqual(card4.cleanName, 'Sağlam Kart');
    assert.strictEqual(card4.detectedNetwork, 'troy');

    const card5 = cleanCardName('Enpara Mastercard');
    assert.strictEqual(card5.cleanName, 'Enpara');
    assert.strictEqual(card5.detectedNetwork, 'mastercard');

    const card6 = cleanCardName('Bonus Flexi Mastercard');
    assert.strictEqual(card6.cleanName, 'Bonus Flexi');
    assert.strictEqual(card6.detectedNetwork, 'mastercard');

    const card7 = cleanCardName('Hepsiburada World Visa');
    assert.strictEqual(card7.cleanName, 'Hepsiburada World');
    assert.strictEqual(card7.detectedNetwork, 'visa');

    // Edge cases with brackets and punctuation
    const edge1 = cleanCardName('Bonus Platinum (Troy)');
    assert.strictEqual(edge1.cleanName, 'Bonus Platinum');
    assert.strictEqual(edge1.detectedNetwork, 'troy');

    const edge2 = cleanCardName('Maximum - Visa');
    assert.strictEqual(edge2.cleanName, 'Maximum');
    assert.strictEqual(edge2.detectedNetwork, 'visa');

    const edge3 = cleanCardName('World [Mastercard]');
    assert.strictEqual(edge3.cleanName, 'World');
    assert.strictEqual(edge3.detectedNetwork, 'mastercard');
});

test('cleanCardName preserves original name if input has no network keyword or only network keyword', () => {
    const plain = cleanCardName('Miles & Smiles');
    assert.strictEqual(plain.cleanName, 'Miles & Smiles');
    assert.strictEqual(plain.detectedNetwork, 'other');

    const onlyNetwork = cleanCardName('Troy');
    assert.strictEqual(onlyNetwork.cleanName, 'Troy');
    assert.strictEqual(onlyNetwork.detectedNetwork, 'troy');
});

test('getCardColorTheme returns correct themes for networks and custom IDs', () => {
    const troyTheme = getCardColorTheme('troy-cyan');
    assert.strictEqual(troyTheme.id, 'troy-cyan');
    assert.strictEqual(troyTheme.network, 'troy');
    assert.ok(troyTheme.bg.includes('linear-gradient'));

    const mcTheme = getCardColorTheme('mastercard-ember');
    assert.strictEqual(mcTheme.id, 'mastercard-ember');
    assert.strictEqual(mcTheme.network, 'mastercard');

    const visaTheme = getCardColorTheme('visa-royal');
    assert.strictEqual(visaTheme.id, 'visa-royal');
    assert.strictEqual(visaTheme.network, 'visa');

    // Default fallback by network
    const defaultTroy = getCardColorTheme(undefined, 'troy');
    assert.strictEqual(defaultTroy.network, 'troy');

    const defaultVisa = getCardColorTheme(undefined, 'visa');
    assert.strictEqual(defaultVisa.network, 'visa');

    const defaultMC = getCardColorTheme(undefined, 'mastercard');
    assert.strictEqual(defaultMC.network, 'mastercard');

    // Unknown fallback to indigo
    const fallback = getCardColorTheme('non-existent-color', 'other');
    assert.strictEqual(fallback.id, 'indigo');
});

test('getColorsForNetwork prioritizes network matching colors first', () => {
    const troyColors = getColorsForNetwork('troy');
    assert.ok(troyColors.length >= 3);
    assert.strictEqual(troyColors[0].network, 'troy');
    assert.strictEqual(troyColors[1].network, 'troy');
    assert.strictEqual(troyColors[2].network, 'troy');

    const mcColors = getColorsForNetwork('mastercard');
    assert.strictEqual(mcColors[0].network, 'mastercard');

    const visaColors = getColorsForNetwork('visa');
    assert.strictEqual(visaColors[0].network, 'visa');
});
