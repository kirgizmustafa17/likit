'use client';

import { Edit3, Trash2, CheckCircle2, Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface TransactionListProps {
    transactions: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    onMarkComplete: (transaction: Transaction) => void;
}

export default function TransactionList({
    transactions,
    onEdit,
    onDelete,
    onMarkComplete,
}: TransactionListProps) {
    if (transactions.length === 0) {
        return (
            <div className="transaction-list">
                <div className="transaction-list-header">
                    <h2>İşlemler</h2>
                </div>
                <div className="transaction-empty">
                    <p>Henüz işlem bulunmuyor.</p>
                </div>
            </div>
        );
    }

    // Group by status
    const planned = transactions.filter(t => !t.is_completed);
    const completed = transactions.filter(t => t.is_completed);

    return (
        <div className="transaction-list">
            <div className="transaction-list-header">
                <h2>İşlemler</h2>
                <span className="transaction-count">{transactions.length} işlem</span>
            </div>

            {planned.length > 0 && (
                <div className="transaction-section">
                    <h3 className="transaction-section-title">
                        <Clock size={14} />
                        Planlanan ({planned.length})
                    </h3>
                    {planned.map((t) => (
                        <TransactionItem
                            key={t.id}
                            transaction={t}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onMarkComplete={onMarkComplete}
                        />
                    ))}
                </div>
            )}

            {completed.length > 0 && (
                <div className="transaction-section">
                    <h3 className="transaction-section-title completed-title">
                        <CheckCircle2 size={14} />
                        Tamamlanan ({completed.length})
                    </h3>
                    {completed.map((t) => (
                        <TransactionItem
                            key={t.id}
                            transaction={t}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onMarkComplete={onMarkComplete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TransactionItem({
    transaction: t,
    onEdit,
    onDelete,
    onMarkComplete,
}: {
    transaction: Transaction;
    onEdit: (t: Transaction) => void;
    onDelete: (id: string) => void;
    onMarkComplete: (t: Transaction) => void;
}) {
    const effectiveAmount = t.is_completed && t.completed_amount != null ? t.completed_amount : t.amount;
    const effectiveDate = t.is_completed && t.completed_date ? t.completed_date : t.transaction_date;
    const isIncome = t.type === 'income';

    return (
        <div className={cn('transaction-item', t.is_completed && 'transaction-item-completed')}>
            <div className="transaction-item-left">
                <div className={cn('transaction-icon', isIncome ? 'income-icon' : 'expense-icon')}>
                    {isIncome ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                </div>
                <div className="transaction-info">
                    <span className="transaction-title">{t.title}</span>
                    <span className="transaction-date">{formatDate(effectiveDate)}</span>
                    {t.is_completed && t.completed_date && t.completed_date !== t.transaction_date && (
                        <span className="transaction-original-date">
                            Planlanan: {formatDate(t.transaction_date)}
                        </span>
                    )}
                </div>
            </div>
            <div className="transaction-item-right">
                <span className={cn('transaction-amount', isIncome ? 'amount-income' : 'amount-expense')}>
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
                            onClick={() => onMarkComplete(t)}
                            className="action-btn action-complete"
                            title="Tamamlandı olarak işaretle"
                        >
                            <CheckCircle2 size={15} />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(t)}
                        className="action-btn action-edit"
                        title="Düzenle"
                    >
                        <Edit3 size={15} />
                    </button>
                    <button
                        onClick={() => onDelete(t.id)}
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
