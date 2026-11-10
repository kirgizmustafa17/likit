'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Home, Briefcase, Zap, Building2, Coins, Repeat, CreditCard as CardIcon, Wallet } from 'lucide-react';
import { RecurringRule, RecurringCategory, RecurringFrequency, CreditCard } from '@/lib/types';
import { RECURRING_CATEGORIES } from '@/lib/recurringUtils';
import { getTodayStr, cn } from '@/lib/utils';

interface RecurringRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (ruleData: Omit<RecurringRule, 'id' | 'created_at'>) => void;
    editingRule?: RecurringRule | null;
    onUpdate?: (id: string, updates: Partial<RecurringRule>) => void;
    cards?: CreditCard[];
}

interface TemplatePreset {
    label: string;
    icon: typeof Home;
    title: string;
    type: 'income' | 'expense';
    category: RecurringCategory;
    defaultDay: number;
    placeholderAmount: string;
}

const TEMPLATES: TemplatePreset[] = [
    { label: 'Kira', icon: Home, title: 'Ev Kirası', type: 'expense', category: 'rent', defaultDay: 15, placeholderAmount: '20000' },
    { label: 'Maaş', icon: Briefcase, title: 'Maaş', type: 'income', category: 'salary', defaultDay: 1, placeholderAmount: '65000' },
    { label: 'Fatura', icon: Zap, title: 'Elektrik & Su Faturası', type: 'expense', category: 'bill', defaultDay: 20, placeholderAmount: '1500' },
    { label: 'Aidat', icon: Building2, title: 'Site / Apartman Aidatı', type: 'expense', category: 'dues', defaultDay: 10, placeholderAmount: '1250' },
    { label: 'Ek Gelir', icon: Coins, title: 'Ek Ödeme / Freelance', type: 'income', category: 'extra_income', defaultDay: 15, placeholderAmount: '10000' },
    { label: 'Abonelik', icon: Repeat, title: 'Dijital Abonelikler', type: 'expense', category: 'subscription', defaultDay: 5, placeholderAmount: '500' },
];

export default function RecurringRuleModal({
    isOpen,
    onClose,
    onSubmit,
    editingRule,
    onUpdate,
    cards = [],
}: RecurringRuleModalProps) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [category, setCategory] = useState<RecurringCategory>('rent');
    const [dayOfMonth, setDayOfMonth] = useState<number>(15);
    const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(getTodayStr());
    const [endDate, setEndDate] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);

    useEffect(() => {
        if (editingRule) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(editingRule.title);
            setAmount(String(editingRule.amount));
            setType(editingRule.type);
            setCategory(editingRule.category);
            setDayOfMonth(editingRule.day_of_month);
            setFrequency(editingRule.frequency);
            setPaymentMethod(editingRule.payment_method);
            setSelectedCardId(editingRule.card_id || (cards[0]?.id || ''));
            setStartDate(editingRule.start_date);
            setEndDate(editingRule.end_date || '');
            setIsActive(editingRule.is_active);
        } else {
            setTitle('');
            setAmount('');
            setType('expense');
            setCategory('rent');
            setDayOfMonth(15);
            setFrequency('monthly');
            setPaymentMethod('cash');
            setSelectedCardId(cards[0]?.id || '');
            setStartDate(getTodayStr());
            setEndDate('');
            setIsActive(true);
        }
    }, [editingRule, isOpen, cards]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleApplyTemplate = (tpl: TemplatePreset) => {
        setTitle(tpl.title);
        setType(tpl.type);
        setCategory(tpl.category);
        setDayOfMonth(tpl.defaultDay);
        if (!amount) setAmount(tpl.placeholderAmount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            alert('Lütfen geçerli bir tutar girin.');
            return;
        }

        if (!title.trim()) {
            alert('Lütfen bir başlık girin.');
            return;
        }

        const rulePayload: Omit<RecurringRule, 'id' | 'created_at'> = {
            title: title.trim(),
            amount: parsedAmount,
            type,
            category,
            day_of_month: Number(dayOfMonth),
            frequency,
            payment_method: paymentMethod,
            card_id: paymentMethod === 'credit_card' ? selectedCardId || null : null,
            start_date: startDate,
            end_date: endDate ? endDate : null,
            is_active: isActive,
        };

        if (editingRule && onUpdate) {
            onUpdate(editingRule.id, rulePayload);
        } else {
            onSubmit(rulePayload);
        }

        onClose();
    };

    return (
        <div className="modal-overlay" id="modal-recurring-rule" onClick={onClose}>
            <div
                className="modal-card modal-card-wide"
                id="modal-recurring-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Repeat size={20} className="text-primary" />
                        <h2 id="modal-recurring-title">
                            {editingRule ? 'Düzenli İşlemi Düzenle' : 'Yeni Düzenli İşlem Ekle'}
                        </h2>
                    </div>
                    <button
                        className="modal-close"
                        id="btn-close-recurring-modal"
                        onClick={onClose}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {!editingRule && (
                    <div className="recurring-templates-bar" id="recurring-templates-bar">
                        <div className="recurring-templates-header">
                            <Sparkles size={14} />
                            <span>Hızlı Şablonlar (Tek Tıkla Doldur)</span>
                        </div>
                        <div className="recurring-templates-grid">
                            {TEMPLATES.map((tpl) => {
                                const IconComponent = tpl.icon;
                                return (
                                    <button
                                        key={tpl.label}
                                        type="button"
                                        id={`btn-tpl-${tpl.category}`}
                                        className={cn(
                                            'recurring-template-chip',
                                            category === tpl.category && 'active'
                                        )}
                                        onClick={() => handleApplyTemplate(tpl)}
                                    >
                                        <IconComponent size={14} />
                                        <span>{tpl.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} id="form-recurring-rule">
                    {/* Income / Expense Toggle */}
                    <div className="type-toggle" id="recurring-type-toggle">
                        <button
                            type="button"
                            id="btn-recurring-type-expense"
                            className={cn('type-btn', type === 'expense' && 'active-expense')}
                            onClick={() => setType('expense')}
                        >
                            Gider
                        </button>
                        <button
                            type="button"
                            id="btn-recurring-type-income"
                            className={cn('type-btn', type === 'income' && 'active-income')}
                            onClick={() => setType('income')}
                        >
                            Gelir
                        </button>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="input-recurring-title">Başlık / Açıklama</label>
                        <input
                            type="text"
                            id="input-recurring-title"
                            placeholder="Örn: Ev Kirası, Maaş, Doğalgaz Faturası, Site Aidatı"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Amount & Category Grid */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="input-recurring-amount">Tutar (₺)</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                id="input-recurring-amount"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="select-recurring-category">Kategori</label>
                            <select
                                id="select-recurring-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as RecurringCategory)}
                            >
                                {Object.entries(RECURRING_CATEGORIES).map(([key, val]) => (
                                    <option key={key} value={key}>
                                        {val.icon} {val.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Day of Month & Frequency */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="select-recurring-day">Ödeme / Tahsilat Günü</label>
                            <select
                                id="select-recurring-day"
                                value={dayOfMonth}
                                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d}>
                                        Her ayın {d}. günü
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="select-recurring-frequency">Tekrarlama Sıklığı</label>
                            <select
                                id="select-recurring-frequency"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                            >
                                <option value="monthly">Aylık (Her Ay)</option>
                                <option value="weekly">Haftalık</option>
                                <option value="yearly">Yıllık</option>
                            </select>
                        </div>
                    </div>

                    {/* Payment Method Selector (Only for expenses) */}
                    {type === 'expense' && (
                        <div className="form-group">
                            <label>Ödeme Yöntemi</label>
                            <div className="type-toggle" style={{ marginBottom: '10px' }} id="recurring-method-toggle">
                                <button
                                    type="button"
                                    id="btn-recurring-method-cash"
                                    className={cn('type-btn', paymentMethod === 'cash' && 'active-income')}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    <Wallet size={15} style={{ marginRight: '6px', display: 'inline-block' }} />
                                    Nakit / Banka
                                </button>
                                <button
                                    type="button"
                                    id="btn-recurring-method-card"
                                    className={cn('type-btn', paymentMethod === 'credit_card' && 'active-expense')}
                                    onClick={() => setPaymentMethod('credit_card')}
                                >
                                    <CardIcon size={15} style={{ marginRight: '6px', display: 'inline-block' }} />
                                    Kredi Kartı
                                </button>
                            </div>

                            {paymentMethod === 'credit_card' && (
                                <div style={{ marginTop: '8px' }}>
                                    {cards.length === 0 ? (
                                        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                            Kayıtlı kredi kartınız bulunmuyor. Önce &quot;Kredi Kartları&quot; sekmesinden kart ekleyin.
                                        </p>
                                    ) : (
                                        <select
                                            id="select-recurring-card"
                                            value={selectedCardId}
                                            onChange={(e) => setSelectedCardId(e.target.value)}
                                            required
                                        >
                                            {cards.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.last_four_digits ? `(•••• ${c.last_four_digits})` : ''} - Kesim Günü: {c.cutoff_day}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Start Date & End Date */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="input-recurring-start-date">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                id="input-recurring-start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="input-recurring-end-date">Bitiş Tarihi (Opsiyonel)</label>
                            <input
                                type="date"
                                id="input-recurring-end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="modal-actions" style={{ marginTop: '20px' }}>
                        <button
                            type="button"
                            id="btn-cancel-recurring-rule"
                            className="btn-secondary"
                            onClick={onClose}
                        >
                            Vazgeç
                        </button>
                        <button
                            type="submit"
                            id="btn-submit-recurring-rule"
                            className="btn-primary"
                        >
                            {editingRule ? 'Değişiklikleri Kaydet' : 'Düzenli İşlemi Başlat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
