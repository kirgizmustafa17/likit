'use client';

import { useState } from 'react';
import { Edit3, Trash2, CheckCircle2, Clock, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronRight, CreditCard as CardIcon } from 'lucide-react';
import { Transaction, CreditCard } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getCategoryLabel, getCategoryIcon } from '@/lib/recurringUtils';

interface TransactionListProps {
    transactions: Transaction[];
    cards?: CreditCard[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string, transaction?: Transaction) => void;
    onMarkComplete: (transaction: Transaction) => void;
}

export default function TransactionList({
    transactions,
    cards = [],
    onEdit,
    onDelete,
    onMarkComplete,
}: TransactionListProps) {
    const [showCompleted, setShowCompleted] = useState(false);
    const [filterMethod, setFilterMethod] = useState<string>('all');

    // Filter transactions by selected method / card
    const filteredTransactions = transactions.filter(t => {
        if (filterMethod === 'all') return true;
        if (filterMethod === 'cash') return !t.card_id;
        return t.card_id === filterMethod;
    });

    if (transactions.length === 0) {
        return (
            <div className="transaction-list" id="tx-list-container">
                <div className="transaction-list-header" id="tx-list-header">
                    <h2 id="tx-list-title">İşlemler</h2>
                </div>
                <div className="transaction-empty" id="tx-list-empty">
                    <p>Bu dönemde işlem bulunmuyor.</p>
                </div>
            </div>
        );
    }

    // Group by status
    const planned = filteredTransactions.filter(t => !t.is_completed);
    const completed = filteredTransactions.filter(t => t.is_completed);

    return (
        <div className="transaction-list" id="tx-list-container">
            <div className="transaction-list-header" id="tx-list-header">
                <div className="transaction-list-title-wrap" id="tx-list-title-wrap">
                    <h2 id="tx-list-title">İşlemler</h2>
                    <span className="transaction-count" id="tx-list-count">{filteredTransactions.length} işlem</span>
                </div>

                {/* Filter Selector */}
                {cards.length > 0 && (
                    <div className="cc-filter-tabs" id="tx-filter-bar">
                        <button
                            id="btn-filter-all"
                            className={`cc-filter-tab ${filterMethod === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterMethod('all')}
                        >
                            Tümü
                        </button>
                        <button
                            id="btn-filter-cash"
                            className={`cc-filter-tab ${filterMethod === 'cash' ? 'active' : ''}`}
                            onClick={() => setFilterMethod('cash')}
                        >
                            Nakit / Banka
                        </button>
                        {cards.map(c => (
                            <button
                                key={c.id}
                                id={`btn-filter-card-${c.id}`}
                                className={`cc-filter-tab ${filterMethod === c.id ? 'active' : ''}`}
                                onClick={() => setFilterMethod(c.id)}
                            >
                                <CardIcon size={13} style={{ display: 'inline-block', marginRight: '5px', verticalAlign: '-1px' }} />
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="transaction-empty" id="tx-empty-filtered">
                    <p>Seçilen filtreye uygun işlem bulunmuyor.</p>
                </div>
            ) : (
                <>
                    {planned.length > 0 && (
                        <div className="transaction-section" id="tx-section-planned">
                            <h3 className="transaction-section-title" id="tx-title-planned">
                                <Clock size={14} />
                                Planlanan ({planned.length})
                            </h3>
                            <div id="tx-items-planned">
                                {planned.map((t) => (
                                    <TransactionItem
                                        key={t.id}
                                        transaction={t}
                                        cards={cards}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onMarkComplete={onMarkComplete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {completed.length > 0 && (
                        <div className="transaction-section" id="tx-section-completed">
                            <h3
                                id="btn-toggle-completed"
                                className="transaction-section-title completed-title clickable"
                                onClick={() => setShowCompleted(!showCompleted)}
                            >
                                {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <CheckCircle2 size={14} />
                                <span id="tx-title-completed">Tamamlanan ({completed.length})</span>
                            </h3>
                            {showCompleted && (
                                <div id="tx-items-completed">
                                    {completed.map((t) => (
                                        <TransactionItem
                                            key={t.id}
                                            transaction={t}
                                            cards={cards}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onMarkComplete={onMarkComplete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function TransactionItem({
    transaction: t,
    cards,
    onEdit,
    onDelete,
    onMarkComplete,
}: {
    transaction: Transaction;
    cards: CreditCard[];
    onEdit: (t: Transaction) => void;
    onDelete: (id: string, t?: Transaction) => void;
    onMarkComplete: (t: Transaction) => void;
}) {
    const effectiveAmount = t.is_completed && t.completed_amount != null ? t.completed_amount : t.amount;
    const effectiveDate = t.is_completed && t.completed_date ? t.completed_date : t.transaction_date;
    const isIncome = t.type === 'income';

    const card = t.card || (t.card_id ? cards.find(c => c.id === t.card_id) : null);

    return (
        <div id={`tx-item-${t.id}`} className={cn('transaction-item', t.is_completed && 'transaction-item-completed')}>
            <div className="transaction-item-left">
                <div className={cn('transaction-icon', isIncome ? 'income-icon' : 'expense-icon')}>
                    {isIncome ? <ArrowUpCircle size={18} /> : card ? <CardIcon size={18} /> : <ArrowDownCircle size={18} />}
                </div>
                <div className="transaction-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="transaction-title" id={`tx-title-${t.id}`}>{t.title}</span>
                        {t.recurring_rule_id && (
                            <span className="recurring-tag-badge" id={`tx-recurring-badge-${t.id}`}>
                                {getCategoryIcon(t.category)} {getCategoryLabel(t.category)}
                            </span>
                        )}
                        {card && (
                            <span className="cc-tag-badge" id={`tx-badge-card-${t.id}`}>
                                💳 {card.name}
                            </span>
                        )}
                        {t.total_installments && t.total_installments > 1 && (
                            <span className="cc-installment-badge" id={`tx-badge-installment-${t.id}`}>
                                {t.installment_no}/{t.total_installments} Taksit
                            </span>
                        )}
                    </div>
                    <span className="transaction-date" id={`tx-date-${t.id}`}>
                        {card ? (
                            <>
                                <span>Kesim: {formatDate(effectiveDate)}</span>
                                {t.due_date && (
                                    <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>
                                        · Son Ödeme: {formatDate(t.due_date)}
                                    </span>
                                )}
                            </>
                        ) : (
                            formatDate(effectiveDate)
                        )}
                        {t.purchase_date && t.purchase_date !== effectiveDate && (
                            <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>
                                (Harcama: {formatDate(t.purchase_date)})
                            </span>
                        )}
                    </span>
                    {t.is_completed && t.completed_date && t.completed_date !== t.transaction_date && (
                        <span className="transaction-original-date">
                            Planlanan: {formatDate(t.transaction_date)}
                        </span>
                    )}
                </div>
            </div>
            <div className="transaction-item-right">
                <span id={`tx-amount-${t.id}`} className={cn('transaction-amount', isIncome ? 'amount-income' : 'amount-expense')}>
                    {isIncome ? '+' : '-'}{formatCurrency(effectiveAmount)}
                </span>
                {t.is_completed && t.completed_amount != null && t.completed_amount !== t.amount && (
                    <span className="transaction-original-amount">
                        Plan: {formatCurrency(t.amount)}
                    </span>
                )}
                <div className="transaction-actions">
                    {!t.is_completed && (
                        <button
                            id={`btn-complete-tx-${t.id}`}
                            onClick={() => onMarkComplete(t)}
                            className="action-btn action-complete"
                            title="Tamamlandı olarak işaretle"
                        >
                            <CheckCircle2 size={15} />
                        </button>
                    )}
                    <button
                        id={`btn-edit-tx-${t.id}`}
                        onClick={() => onEdit(t)}
                        className="action-btn action-edit"
                        title="Düzenle"
                    >
                        <Edit3 size={15} />
                    </button>
                    <button
                        id={`btn-delete-tx-${t.id}`}
                        onClick={() => onDelete(t.id, t)}
                        className="action-btn action-delete"
                        title="Sil"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
