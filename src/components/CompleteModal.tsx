'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { getTodayStr, formatCurrency, formatDate } from '@/lib/utils';

interface CompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onComplete: (id: string, completedDate: string, completedAmount: number) => void;
}

export default function CompleteModal({
    isOpen,
    onClose,
    transaction,
    onComplete,
}: CompleteModalProps) {
    const [completedDate, setCompletedDate] = useState('');
    const [completedAmount, setCompletedAmount] = useState('');

    // Reset state and default to today when modal opens
    useEffect(() => {
        if (isOpen && transaction) {
            setCompletedDate(getTodayStr());
            setCompletedAmount(String(transaction.amount));
        }
    }, [isOpen, transaction]);

    if (!isOpen || !transaction) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(
            transaction.id,
            completedDate || getTodayStr(),
            completedAmount ? parseFloat(completedAmount) : transaction.amount
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>İşlemi Tamamla</h2>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="complete-info">
                    <p className="complete-title">{transaction.title}</p>
                    <p className="complete-planned">
                        Planlanan: {formatCurrency(transaction.amount)} – {formatDate(transaction.transaction_date)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="form">
                    <div className="form-group">
                        <label htmlFor="completed-date">Gerçekleşme Tarihi</label>
                        <input
                            id="completed-date"
                            type="date"
                            value={completedDate}
                            onChange={(e) => setCompletedDate(e.target.value)}
                        />
                        <span className="form-hint">Varsayılan: bugün</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="completed-amount">Gerçekleşen Tutar (₺)</label>
                        <input
                            id="completed-amount"
                            type="number"
                            value={completedAmount}
                            onChange={(e) => setCompletedAmount(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                        <span className="form-hint">Varsayılan: planlanan tutar</span>
                    </div>

                    <button type="submit" className="btn-success">
                        <Check size={18} />
                        Tamamlandı Olarak İşaretle
                    </button>
                </form>
            </div>
        </div>
    );
}
