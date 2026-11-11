'use client';

import { useState } from 'react';
import { Plus, CreditCard as CardIcon, Edit3, Trash2, Calendar, AlertCircle, ShoppingBag, CheckCircle2, Star } from 'lucide-react';
import { CreditCard, CreditCardSummary, Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getCardColorTheme } from '@/lib/creditCardUtils';
import CardNetworkBadge from './CardNetworkBadge';

interface CreditCardsViewProps {
    cards: CreditCardSummary[];
    transactions: Transaction[];
    onAddCard: () => void;
    onEditCard: (card: CreditCard) => void;
    onDeleteCard: (id: string) => void;
    onSetDefaultCard?: (id: string) => void;
    onAddExpense: (cardId?: string) => void;
    onMarkComplete: (transaction: Transaction) => void;
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (id: string, transaction?: Transaction) => void;
}

export default function CreditCardsView({
    cards,
    transactions,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onSetDefaultCard,
    onAddExpense,
    onMarkComplete,
    onEditTransaction,
    onDeleteTransaction,
}: CreditCardsViewProps) {
    const [selectedCardId, setSelectedCardId] = useState<string | 'all'>('all');

    // If previously selected card was deleted, safely fallback to 'all'
    const activeSelectedId = selectedCardId === 'all' || cards.some(c => c.id === selectedCardId)
        ? selectedCardId
        : 'all';

    // Aggregate statistics across all cards
    const totalLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0);
    const totalDebt = cards.reduce((sum, c) => sum + c.current_debt, 0);
    const totalAvailable = Math.max(0, totalLimit - totalDebt);

    // Filter card transactions
    const cardTransactions = transactions.filter(t => {
        if (activeSelectedId === 'all') {
            return Boolean(t.card_id);
        }
        return t.card_id === activeSelectedId;
    });

    const pendingCardTxns = cardTransactions.filter(t => !t.is_completed);
    const completedCardTxns = cardTransactions.filter(t => t.is_completed);

    return (
        <div className="credit-cards-view" id="cc-view-container">
            {/* Top Stats */}
            <div className="stats-grid" id="cc-stats-grid">
                <div className="stat-card stat-balance" id="stat-cc-total-limit">
                    <div className="stat-icon-wrap">
                        <CardIcon size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Toplam Kart Limiti</span>
                        <span className="stat-value" id="stat-cc-total-limit-val">{formatCurrency(totalLimit)}</span>
                    </div>
                </div>

                <div className="stat-card stat-expense" id="stat-cc-total-debt">
                    <div className="stat-icon-wrap">
                        <AlertCircle size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Güncel Kart Borçları</span>
                        <span className="stat-value negative" id="stat-cc-total-debt-val">{formatCurrency(totalDebt)}</span>
                    </div>
                </div>

                <div className="stat-card stat-income" id="stat-cc-total-available">
                    <div className="stat-icon-wrap">
                        <CheckCircle2 size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Kullanılabilir Toplam Limit</span>
                        <span className="stat-value positive" id="stat-cc-total-available-val">{formatCurrency(totalAvailable)}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="cc-actions-bar" id="cc-actions-bar">
                <div className="cc-actions-left">
                    <h2 id="cc-actions-title">Kayıtlı Kartlar ({cards.length})</h2>
                </div>
                <div className="cc-actions-right">
                    <button id="btn-add-card-expense" onClick={() => onAddExpense()} className="btn-secondary" type="button">
                        <ShoppingBag size={16} />
                        <span>Kart Harcaması Ekle</span>
                    </button>
                    <button id="btn-add-card" onClick={onAddCard} className="btn-primary" type="button">
                        <Plus size={16} />
                        <span>Yeni Kart Ekle</span>
                    </button>
                </div>
            </div>

            {/* Cards Carousel / Grid */}
            {cards.length === 0 ? (
                <div className="cc-empty-state" id="cc-empty-state">
                    <div className="cc-empty-icon">
                        <CardIcon size={36} />
                    </div>
                    <h3>Henüz Kredi Kartı Eklenmemiş</h3>
                    <p>
                        Kredi kartlarınızı tanımlayarak hesap kesim ve son ödeme tarihlerine göre
                        taksitli ve peşin harcamalarınızın nakit akışını otomatik takip edebilirsiniz.
                    </p>
                    <button id="btn-add-first-card" onClick={onAddCard} className="btn-primary" type="button">
                        <Plus size={16} />
                        <span>İlk Kredi Kartınızı Ekleyin</span>
                    </button>
                </div>
            ) : (
                <div className="cc-cards-grid" id="cc-cards-grid">
                    {cards.map(card => {
                        const colorDef = getCardColorTheme(card.color, card.card_network);
                        const usagePercent = card.credit_limit > 0
                            ? Math.min(100, Math.round((card.current_debt / card.credit_limit) * 100))
                            : 0;

                        return (
                            <div
                                key={card.id}
                                id={`vcc-card-${card.id}`}
                                className={`visual-credit-card ${activeSelectedId === card.id ? 'selected' : ''}`}
                                style={{
                                    background: colorDef.bg,
                                    borderColor: colorDef.border,
                                }}
                                onClick={() => setSelectedCardId(activeSelectedId === card.id ? 'all' : card.id)}
                            >
                                <div className="vcc-top">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="vcc-bank" id={`vcc-bank-${card.id}`}>{card.bank_name || 'Kredi Kartı'}</div>
                                        {card.is_default && (
                                            <span
                                                id={`vcc-badge-default-${card.id}`}
                                                className="vcc-default-badge"
                                                title="Varsayılan Harcama Kartı"
                                            >
                                                <Star size={10} className="vcc-star-icon" fill="#f59e0b" color="#f59e0b" />
                                                <span>Varsayılan</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="vcc-actions" onClick={(e) => e.stopPropagation()}>
                                        {!card.is_default && onSetDefaultCard && (
                                            <button
                                                id={`btn-set-default-card-${card.id}`}
                                                onClick={() => onSetDefaultCard(card.id)}
                                                className="vcc-icon-btn vcc-star-btn"
                                                title="Bu kartı varsayılan harcama kartı yap"
                                                type="button"
                                            >
                                                <Star size={14} />
                                            </button>
                                        )}
                                        <button
                                            id={`btn-edit-card-${card.id}`}
                                            onClick={() => onEditCard(card)}
                                            className="vcc-icon-btn"
                                            title="Kartı Düzenle"
                                            type="button"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            id={`btn-delete-card-${card.id}`}
                                            onClick={() => {
                                                if (confirm(`"${card.name}" kartını silmek istediğinize emin misiniz?`)) {
                                                    onDeleteCard(card.id);
                                                }
                                            }}
                                            className="vcc-icon-btn vcc-delete"
                                            title="Kartı Sil"
                                            type="button"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="vcc-chip-row">
                                    <div className="vcc-chip" />
                                    <svg
                                        className="vcc-contactless-icon"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M8.5 16.5a6 6 0 0 1 0-9" />
                                        <path d="M12 19a10 10 0 0 1 0-14" />
                                        <path d="M15.5 21.5a14 14 0 0 1 0-19" />
                                    </svg>
                                </div>

                                <div className="vcc-number" id={`vcc-lastfour-${card.id}`}>
                                    •••• •••• •••• {card.last_four_digits || '••••'}
                                </div>

                                <div className="vcc-name-row">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="vcc-name" id={`vcc-name-${card.id}`}>{card.name}</span>
                                        <span className="vcc-dates-info" id={`vcc-cutoff-${card.id}`}>
                                            Kesim: Ayın {card.cutoff_day}. günü
                                        </span>
                                    </div>
                                    <CardNetworkBadge network={card.card_network} variant="card" />
                                </div>

                                {/* Progress Bar of limit usage */}
                                <div className="vcc-progress-wrap">
                                    <div className="vcc-progress-bar">
                                        <div
                                            className="vcc-progress-fill"
                                            style={{
                                                width: `${usagePercent}%`,
                                                backgroundColor: usagePercent > 80 ? '#f87171' : usagePercent > 50 ? '#fbbf24' : '#34d399',
                                            }}
                                        />
                                    </div>
                                    <div className="vcc-limit-labels">
                                        <span id={`vcc-debt-${card.id}`}>Borç: {formatCurrency(card.current_debt)}</span>
                                        <span id={`vcc-limit-${card.id}`}>Limit: {formatCurrency(card.credit_limit)}</span>
                                    </div>
                                </div>

                                {/* Next dates pills */}
                                <div className="vcc-pills">
                                    <span className="vcc-pill" id={`vcc-next-cutoff-${card.id}`}>
                                        <Calendar size={11} /> Kesim: {formatDate(card.next_cutoff_date)}
                                    </span>
                                    <span className="vcc-pill due-pill" id={`vcc-due-${card.id}`}>
                                        <Calendar size={11} /> Son Ödeme: {formatDate(card.next_due_date)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Credit Card Transactions Table / List */}
            {cards.length > 0 && (
                <div className="transaction-list" id="cc-tx-list-section" style={{ marginTop: '32px' }}>
                    <div className="transaction-list-header">
                        <div className="transaction-list-title-wrap" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <h2 id="cc-tx-list-title">Kredi Kartı Harcamaları &amp; Taksitler</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {activeSelectedId === 'all'
                                    ? 'Tüm kartlara ait vadeli taksitler ve ödemeler'
                                    : `"${cards.find(c => c.id === activeSelectedId)?.name}" kartına ait işlemler`}
                            </p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="cc-filter-tabs" id="cc-tx-filter-bar">
                            <button
                                id="btn-cc-filter-all"
                                className={`cc-filter-tab ${activeSelectedId === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedCardId('all')}
                            >
                                Tüm Kartlar
                            </button>
                            {cards.map(c => (
                                <button
                                    key={c.id}
                                    id={`btn-cc-filter-card-${c.id}`}
                                    className={`cc-filter-tab ${activeSelectedId === c.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCardId(c.id)}
                                >
                                    <CardNetworkBadge network={c.card_network} variant="icon" />
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {pendingCardTxns.length === 0 && completedCardTxns.length === 0 ? (
                        <div className="transaction-empty" id="cc-tx-empty">
                            <p>Bu kart için kayıtlı harcama veya taksit bulunmuyor.</p>
                            <button
                                id="btn-add-expense-to-card"
                                onClick={() => onAddExpense(activeSelectedId === 'all' ? undefined : activeSelectedId)}
                                className="btn-secondary"
                                style={{ marginTop: '12px' }}
                            >
                                <Plus size={14} />
                                <span>Bu Karta Harcama Ekle</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {pendingCardTxns.length > 0 && (
                                <div className="transaction-section" id="cc-tx-section-pending">
                                    <h3 className="transaction-section-title" id="cc-tx-title-pending">
                                        Ödenecek / Gelecek Taksitler ({pendingCardTxns.length})
                                    </h3>
                                    <div id="cc-tx-items-pending">
                                        {pendingCardTxns.map(t => {
                                            const card = cards.find(c => c.id === t.card_id);
                                            return (
                                                <div key={t.id} id={`cc-tx-item-${t.id}`} className="transaction-item">
                                                    <div className="transaction-item-left">
                                                        <div className="transaction-icon expense-icon">
                                                            <CardIcon size={18} />
                                                        </div>
                                                        <div className="transaction-info">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span className="transaction-title" id={`cc-tx-title-${t.id}`}>{t.title}</span>
                                                                {card && (
                                                                    <span className="cc-tag-badge">
                                                                        <CardNetworkBadge network={card.card_network} variant="icon" />
                                                                        <span>{card.name}</span>
                                                                    </span>
                                                                )}
                                                                {t.total_installments && t.total_installments > 1 && (
                                                                    <span className="cc-installment-badge">
                                                                        {t.installment_no}/{t.total_installments} Taksit
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="transaction-date">
                                                                Son Ödeme (Nakit Akışı): {formatDate(t.transaction_date)}
                                                                {t.purchase_date && ` · Harcama: ${formatDate(t.purchase_date)}`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="transaction-item-right">
                                                        <span id={`cc-tx-amount-${t.id}`} className="transaction-amount amount-expense">
                                                            -{formatCurrency(t.amount)}
                                                        </span>
                                                        <div className="transaction-actions" style={{ opacity: 1 }}>
                                                            <button
                                                                id={`btn-complete-cc-tx-${t.id}`}
                                                                onClick={() => onMarkComplete(t)}
                                                                className="action-btn action-complete"
                                                                title="Ödendi olarak işaretle"
                                                            >
                                                                <CheckCircle2 size={15} />
                                                            </button>
                                                            <button
                                                                id={`btn-edit-cc-tx-${t.id}`}
                                                                onClick={() => onEditTransaction(t)}
                                                                className="action-btn action-edit"
                                                                title="Düzenle"
                                                            >
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button
                                                                id={`btn-delete-cc-tx-${t.id}`}
                                                                onClick={() => onDeleteTransaction(t.id, t)}
                                                                className="action-btn action-delete"
                                                                title="Sil"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {completedCardTxns.length > 0 && (
                                <div className="transaction-section" id="cc-tx-section-completed" style={{ marginTop: '20px' }}>
                                    <h3 className="transaction-section-title completed-title" id="cc-tx-title-completed">
                                        <CheckCircle2 size={14} />
                                        Ödenmiş Taksitler ({completedCardTxns.length})
                                    </h3>
                                    <div id="cc-tx-items-completed">
                                        {completedCardTxns.map(t => {
                                            const card = cards.find(c => c.id === t.card_id);
                                            return (
                                                <div key={t.id} id={`cc-tx-item-${t.id}`} className="transaction-item transaction-item-completed">
                                                    <div className="transaction-item-left">
                                                        <div className="transaction-icon expense-icon">
                                                            <CardIcon size={18} />
                                                        </div>
                                                        <div className="transaction-info">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span className="transaction-title">{t.title}</span>
                                                                {card && (
                                                                    <span className="cc-tag-badge">
                                                                        <CardNetworkBadge network={card.card_network} variant="icon" />
                                                                        <span>{card.name}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="transaction-date">
                                                                Ödendi: {formatDate(t.completed_date || t.transaction_date)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="transaction-item-right">
                                                        <span className="transaction-amount amount-expense">
                                                            -{formatCurrency(t.completed_amount != null ? t.completed_amount : t.amount)}
                                                        </span>
                                                        <div className="transaction-actions" style={{ opacity: 1 }}>
                                                            <button
                                                                id={`btn-delete-completed-cc-tx-${t.id}`}
                                                                onClick={() => onDeleteTransaction(t.id, t)}
                                                                className="action-btn action-delete"
                                                                title="Sil"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
