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
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCompletedDate(getTodayStr());
            setCompletedAmount(String(transaction.amount));
        }
    }, [isOpen, transaction]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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
        <div className="modal-overlay" id="modal-complete" onClick={onClose}>
            <div className="modal-content modal-sm" id="modal-complete-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="modal-complete-title">İşlemi Tamamla</h2>
                    <button id="btn-close-complete-modal" onClick={onClose} className="modal-close-btn" type="button">
                        <X size={20} />
                    </button>
                </div>

                <div className="complete-info" id="complete-info">
                    <p className="complete-title" id="complete-info-title">{transaction.title}</p>
                    <p className="complete-planned" id="complete-info-planned">
                        Planlanan: {formatCurrency(transaction.amount)} – {formatDate(transaction.transaction_date)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="form" id="form-complete">
                    <div className="form-group">
                        <label htmlFor="input-complete-date">Gerçekleşme Tarihi</label>
                        <input
                            id="input-complete-date"
                            type="date"
                            value={completedDate}
                            onChange={(e) => setCompletedDate(e.target.value)}
                        />
                        <span className="form-hint">Varsayılan: bugün</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="input-complete-amount">Gerçekleşen Tutar (₺)</label>
                        <input
                            id="input-complete-amount"
                            type="number"
                            value={completedAmount}
                            onChange={(e) => setCompletedAmount(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                        <span className="form-hint">Varsayılan: planlanan tutar</span>
                    </div>

                    <button type="submit" id="btn-submit-complete" className="btn-success">
                        <Check size={18} />
                        Tamamlandı Olarak İşaretle
                    </button>
                </form>
            </div>
        </div>
    );
}
