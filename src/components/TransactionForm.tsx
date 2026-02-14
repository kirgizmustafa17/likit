'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { cn, getTodayStr } from '@/lib/utils';

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        amount: number;
        transaction_date: string;
        type: 'income' | 'expense';
        is_completed: boolean;
    }) => void;
    editingTransaction?: Transaction | null;
    onUpdate?: (id: string, data: Partial<Transaction>) => void;
}

export default function TransactionForm({
    isOpen,
    onClose,
    onSubmit,
    editingTransaction,
    onUpdate,
}: TransactionFormProps) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (editingTransaction) {
            setTitle(editingTransaction.title);
            setAmount(String(editingTransaction.amount));
            setDate(editingTransaction.transaction_date);
            setType(editingTransaction.type);
            setIsCompleted(editingTransaction.is_completed);
        } else {
            setTitle('');
            setAmount('');
            setDate(getTodayStr());
            setType('expense');
            setIsCompleted(false);
        }
    }, [editingTransaction, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount || !date) return;

        if (editingTransaction && onUpdate) {
            onUpdate(editingTransaction.id, {
                title,
                amount: parseFloat(amount),
                transaction_date: date,
                type,
                is_completed: isCompleted,
            });
        } else {
            onSubmit({
                title,
                amount: parseFloat(amount),
                transaction_date: date,
                type,
                is_completed: isCompleted,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{editingTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem'}</h2>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    <div className="form-group">
                        <label htmlFor="title">Açıklama</label>
                        <input
                            id="title"
                            type="text"
                            placeholder="Örn: Market alışverişi"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="amount">Tutar (₺)</label>
                            <input
                                id="amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date">Tarih</label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tür</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={cn('type-btn', type === 'income' && 'type-btn-active-income')}
                                onClick={() => setType('income')}
                            >
                                Gelir
                            </button>
                            <button
                                type="button"
                                className={cn('type-btn', type === 'expense' && 'type-btn-active-expense')}
                                onClick={() => setType('expense')}
                            >
                                Gider
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => setIsCompleted(e.target.checked)}
                            />
                            <span>Gerçekleşti (Yapıldı)</span>
                        </label>
                    </div>

                    <button type="submit" className="btn-primary">
                        {editingTransaction ? 'Güncelle' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
