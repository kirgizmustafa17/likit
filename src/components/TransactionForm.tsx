'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, Wallet } from 'lucide-react';
import { Transaction, CreditCard } from '@/lib/types';
import { cn, getTodayStr } from '@/lib/utils';
import {
    calculateCardCutoffAndDueDate,
    calculateInstallmentDueDates,
    calculateInstallmentCutoffDates,
} from '@/lib/creditCardUtils';

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        amount: number;
        transaction_date: string;
        type: 'income' | 'expense';
        is_completed: boolean;
        card_id?: string | null;
        purchase_date?: string | null;
        due_date?: string | null;
        total_installments?: number;
        completed_date?: string | null;
        completed_amount?: number | null;
    }) => void;
    editingTransaction?: Transaction | null;
    onUpdate?: (id: string, data: Partial<Transaction>) => void;
    cards?: CreditCard[];
    defaultCardId?: string;
}

export default function TransactionForm({
    isOpen,
    onClose,
    onSubmit,
    editingTransaction,
    onUpdate,
    cards = [],
    defaultCardId,
}: TransactionFormProps) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [isCompleted, setIsCompleted] = useState(false);

    // Credit Card specific state
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [installments, setInstallments] = useState('1');

    useEffect(() => {
        if (editingTransaction) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(editingTransaction.title);
            setAmount(String(editingTransaction.amount));
            setDate(editingTransaction.transaction_date);
            setType(editingTransaction.type);
            setIsCompleted(editingTransaction.is_completed);

            if (editingTransaction.card_id) {
                setPaymentMethod('credit_card');
                setSelectedCardId(editingTransaction.card_id);
                setPurchaseDate(editingTransaction.purchase_date || editingTransaction.transaction_date);
                setInstallments(String(editingTransaction.total_installments || 1));
            } else {
                setPaymentMethod('cash');
                setSelectedCardId(defaultCardId || (cards[0]?.id || ''));
                setPurchaseDate(getTodayStr());
                setInstallments('1');
            }
        } else {
            setTitle('');
            setAmount('');
            setDate(getTodayStr());
            setType('expense');
            setIsCompleted(false);
            setPaymentMethod(defaultCardId ? 'credit_card' : 'cash');
            setSelectedCardId(defaultCardId || (cards[0]?.id || ''));
            setPurchaseDate(getTodayStr());
            setInstallments('1');
        }
    }, [editingTransaction, isOpen, cards, defaultCardId]);

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

    // Check if editing an existing installment in a multi-installment plan
    const isExistingInstallment = Boolean(
        editingTransaction &&
        editingTransaction.card_id &&
        editingTransaction.installment_no &&
        editingTransaction.total_installments &&
        editingTransaction.total_installments > 1
    );

    // When card or purchase date changes in credit_card mode, update the effective transaction_date (due date)
    const selectedCard = cards.find(c => c.id === selectedCardId) || (cards.length > 0 ? cards[0] : undefined);
    const parsedInstallments = Math.max(1, parseInt(installments, 10) || 1);

    // Live calculation of cutoff date and due date
    let calculatedCutoffDate = '';
    let calculatedDueDate = '';

    if (paymentMethod === 'credit_card' && selectedCard && purchaseDate) {
        const cycle = calculateCardCutoffAndDueDate(selectedCard, purchaseDate);
        calculatedCutoffDate = cycle.cutoffDate;

        if (isExistingInstallment) {
            // For an existing installment, calculate dates for THIS specific installment number
            const allCutoffDates = calculateInstallmentCutoffDates(
                selectedCard,
                purchaseDate,
                editingTransaction!.total_installments!
            );
            const allDueDates = calculateInstallmentDueDates(
                selectedCard,
                purchaseDate,
                editingTransaction!.total_installments!
            );
            const installmentIdx = (editingTransaction!.installment_no || 1) - 1;
            calculatedCutoffDate = allCutoffDates[installmentIdx] || editingTransaction!.transaction_date;
            calculatedDueDate = allDueDates[installmentIdx] || editingTransaction!.due_date || cycle.dueDate;
        } else {
            calculatedCutoffDate = cycle.cutoffDate;
            calculatedDueDate = cycle.dueDate;
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount) return;

        const isCC = type === 'expense' && paymentMethod === 'credit_card' && Boolean(selectedCard);
        // Effective transaction date is calculated cutoff date for credit cards, or user date for cash
        const effectiveDate = isCC && calculatedCutoffDate ? calculatedCutoffDate : (date || getTodayStr());

        if (editingTransaction && onUpdate) {
            onUpdate(editingTransaction.id, {
                title,
                amount: parseFloat(amount),
                transaction_date: effectiveDate,
                type,
                is_completed: isCompleted,
                card_id: isCC ? selectedCard?.id : null,
                purchase_date: isCC ? purchaseDate : null,
                due_date: isCC ? calculatedDueDate : null,
                installment_no: editingTransaction.installment_no || (isCC ? 1 : null),
                total_installments: isCC ? (editingTransaction.total_installments || parsedInstallments) : 1,
                ...(isCompleted && {
                    completed_date: effectiveDate,
                    completed_amount: parseFloat(amount),
                }),
                ...(!isCompleted && {
                    completed_date: null,
                    completed_amount: null,
                }),
            });
        } else {
            onSubmit({
                title,
                amount: parseFloat(amount),
                transaction_date: effectiveDate,
                type,
                is_completed: isCompleted,
                card_id: isCC ? selectedCard?.id : null,
                purchase_date: isCC ? purchaseDate : null,
                due_date: isCC ? calculatedDueDate : null,
                total_installments: isCC ? parsedInstallments : 1,
                completed_date: isCompleted ? effectiveDate : null,
                completed_amount: isCompleted ? parseFloat(amount) : null,
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" id="modal-transaction-form" onClick={onClose}>
            <div className="modal-content" id="modal-transaction-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="modal-transaction-title">{editingTransaction ? 'İşlemi Düzenle' : 'Yeni İşlem'}</h2>
                    <button id="btn-close-tx-modal" onClick={onClose} className="modal-close-btn" type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="form" id="form-transaction">
                    <div className="form-group">
                        <label htmlFor="input-tx-title">Açıklama</label>
                        <input
                            id="input-tx-title"
                            type="text"
                            placeholder="Örn: Market alışverişi, Kira, Elektronik"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="input-tx-amount">Toplam Tutar (₺)</label>
                            <input
                                id="input-tx-amount"
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        {paymentMethod === 'cash' || type === 'income' ? (
                            <div className="form-group">
                                <label htmlFor="input-tx-date">Tarih</label>
                                <input
                                    id="input-tx-date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        ) : (
                            <div className="form-group">
                                <label htmlFor="input-tx-purchase-date">Harcama Tarihi</label>
                                <input
                                    id="input-tx-purchase-date"
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Tür</label>
                        <div className="type-toggle" id="tx-type-toggle">
                            <button
                                type="button"
                                id="btn-tx-type-income"
                                className={cn('type-btn', type === 'income' && 'type-btn-active-income')}
                                onClick={() => {
                                    setType('income');
                                    setPaymentMethod('cash');
                                }}
                            >
                                Gelir
                            </button>
                            <button
                                type="button"
                                id="btn-tx-type-expense"
                                className={cn('type-btn', type === 'expense' && 'type-btn-active-expense')}
                                onClick={() => setType('expense')}
                            >
                                Gider
                            </button>
                        </div>
                    </div>

                    {/* Payment Method Selector (Only for expenses) */}
                    {type === 'expense' && (
                        <div className="form-group">
                            <label>Ödeme Yöntemi</label>
                            <div className="type-toggle" id="tx-method-toggle">
                                <button
                                    type="button"
                                    id="btn-method-cash"
                                    className={cn('type-btn', paymentMethod === 'cash' && 'type-btn-active-cash')}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <Wallet size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Banka / Nakit
                                </button>
                                <button
                                    type="button"
                                    id="btn-method-card"
                                    className={cn('type-btn', paymentMethod === 'credit_card' && 'type-btn-active-cc')}
                                    onClick={() => setPaymentMethod('credit_card')}
                                    disabled={cards.length === 0}
                                    title={cards.length === 0 ? 'Önce kredi kartı eklemelisiniz' : ''}
                                >
                                    <CardIcon size={15} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Kredi Kartı
                                    {cards.length === 0 && ' (Kart Yok)'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Credit Card Details */}
                    {type === 'expense' && paymentMethod === 'credit_card' && cards.length > 0 && (
                        <div className="cc-form-details" id="tx-cc-form-details">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="select-tx-card">Kart Seçimi</label>
                                    <select
                                        id="select-tx-card"
                                        value={selectedCardId}
                                        onChange={(e) => setSelectedCardId(e.target.value)}
                                        className="select-input"
                                        required
                                    >
                                        {cards.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.bank_name ? `(${c.bank_name})` : ''} · Kesim: {c.cutoff_day}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {isExistingInstallment ? (
                                    <div className="form-group">
                                        <label>Taksit Durumu</label>
                                        <div
                                            id="tx-installment-status-badge"
                                            className="select-input"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                opacity: 0.9,
                                                background: 'var(--bg-glass)',
                                                fontWeight: 600,
                                                color: '#fbbf24',
                                            }}
                                        >
                                            {editingTransaction!.installment_no} / {editingTransaction!.total_installments}. Taksit
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label htmlFor="select-tx-installments">Taksit Sayısı</label>
                                        <select
                                            id="select-tx-installments"
                                            value={installments}
                                            onChange={(e) => setInstallments(e.target.value)}
                                            className="select-input"
                                        >
                                            <option value="1">Tek Çekim (Peşin)</option>
                                            <option value="2">2 Taksit</option>
                                            <option value="3">3 Taksit</option>
                                            <option value="4">4 Taksit</option>
                                            <option value="5">5 Taksit</option>
                                            <option value="6">6 Taksit</option>
                                            <option value="9">9 Taksit</option>
                                            <option value="12">12 Taksit</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="checkbox-label" id="label-tx-completed">
                            <input
                                id="checkbox-tx-completed"
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => setIsCompleted(e.target.checked)}
                            />
                            <span>Gerçekleşti (Ödendi / Hesaptan Çıktı)</span>
                        </label>
                    </div>

                    <button type="submit" id="btn-submit-transaction" className="btn-primary">
                        {editingTransaction ? 'Güncelle' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
