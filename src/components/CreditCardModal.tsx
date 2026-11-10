'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, Check } from 'lucide-react';
import { CreditCard } from '@/lib/types';

interface CreditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (cardData: Omit<CreditCard, 'id' | 'created_at'>) => Promise<void>;
    editingCard?: CreditCard | null;
    onUpdate?: (id: string, updates: Partial<CreditCard>) => Promise<void>;
}

export const CARD_COLORS = [
    { id: 'indigo', name: 'İndigo', bg: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', border: '#6366f1' },
    { id: 'emerald', name: 'Zümrüt', bg: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', border: '#10b981' },
    { id: 'blue', name: 'Okyanus', bg: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)', border: '#38bdf8' },
    { id: 'purple', name: 'Mor', bg: 'linear-gradient(135deg, #9333ea 0%, #581c87 100%)', border: '#c084fc' },
    { id: 'rose', name: 'Gül Kurusu', bg: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)', border: '#fb7185' },
    { id: 'amber', name: 'Altın', bg: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)', border: '#f59e0b' },
    { id: 'slate', name: 'Koyu Grafit', bg: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)', border: '#64748b' },
];

export const POPULAR_BANKS = [
    'Garanti BBVA',
    'İş Bankası',
    'Yapı Kredi',
    'Akbank',
    'QNB',
    'Enpara',
    'Ziraat Bankası',
    'Vakıfbank',
];

export default function CreditCardModal({
    isOpen,
    onClose,
    onSubmit,
    editingCard,
    onUpdate,
}: CreditCardModalProps) {
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState('');
    const [lastFour, setLastFour] = useState('');
    const [creditLimit, setCreditLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('15');
    const [color, setColor] = useState('indigo');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editingCard) {
            setName(editingCard.name || '');
            setBankName(editingCard.bank_name || '');
            setLastFour(editingCard.last_four_digits || '');
            setCreditLimit(editingCard.credit_limit ? String(editingCard.credit_limit) : '0');
            setCutoffDay(String(editingCard.cutoff_day || 15));
            setColor(editingCard.color || 'indigo');
        } else {
            setName('');
            setBankName('Garanti BBVA');
            setLastFour('');
            setCreditLimit('50000');
            setCutoffDay('15');
            setColor('indigo');
        }
    }, [editingCard, isOpen]);

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setSaving(true);
        try {
            const cutoffNum = Math.min(31, Math.max(1, parseInt(cutoffDay, 10) || 1));
            const autoDueDay = cutoffNum + 10 > 30 ? (cutoffNum + 10 - 30) : (cutoffNum + 10);
            const cardData = {
                name,
                bank_name: bankName || null,
                last_four_digits: lastFour ? lastFour.slice(0, 4) : null,
                credit_limit: parseFloat(creditLimit) || 0,
                cutoff_day: cutoffNum,
                due_day: autoDueDay,
                color,
                is_active: true,
            };

            if (editingCard && onUpdate) {
                await onUpdate(editingCard.id, cardData);
            } else {
                await onSubmit(cardData);
            }
            onClose();
        } catch (err) {
            console.error('Save card error:', err);
        } finally {
            setSaving(false);
        }
    };

    const activeColorObj = CARD_COLORS.find(c => c.id === color) || CARD_COLORS[0];

    return (
        <div className="modal-overlay" id="modal-credit-card" onClick={onClose}>
            <div className="modal-content" id="modal-credit-card-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CardIcon size={20} className="logo-icon" />
                        <h2 id="modal-credit-card-title">{editingCard ? 'Kredi Kartını Düzenle' : 'Yeni Kredi Kartı Ekle'}</h2>
                    </div>
                    <button id="btn-close-cc-modal" onClick={onClose} className="modal-close-btn" type="button">
                        <X size={20} />
                    </button>
                </div>

                {/* Live Card Preview */}
                <div
                    id="vcc-preview"
                    className="card-preview"
                    style={{
                        background: activeColorObj.bg,
                        border: `1px solid ${activeColorObj.border}`,
                    }}
                >
                    <div className="card-preview-header">
                        <span className="card-preview-bank" id="vcc-preview-bank">{bankName || 'Banka Adı'}</span>
                        <CardIcon size={22} className="card-preview-icon" />
                    </div>
                    <div className="card-preview-chip" />
                    <div className="card-preview-number" id="vcc-preview-number">
                        •••• •••• •••• {lastFour ? lastFour.padStart(4, '•').slice(-4) : '••••'}
                    </div>
                    <div className="card-preview-footer">
                        <div>
                            <span className="card-preview-label">Kart Adı</span>
                            <div className="card-preview-val" id="vcc-preview-name">{name || 'Kart İsmi'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="card-preview-label">Hesap Kesim</span>
                            <div className="card-preview-val" id="vcc-preview-cutoff">Ayın {cutoffDay}&apos;i (+10 gün vade)</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form" id="form-credit-card" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                        <label htmlFor="input-cc-name">Kart İsmi / Tanımı</label>
                        <input
                            id="input-cc-name"
                            type="text"
                            placeholder="Örn: Bonus Platinum, Maximum Kartım"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="input-cc-bank">Banka</label>
                            <input
                                id="input-cc-bank"
                                type="text"
                                placeholder="Banka adı"
                                list="bank-list"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                            />
                            <datalist id="bank-list">
                                {POPULAR_BANKS.map(b => (
                                    <option key={b} value={b} />
                                ))}
                            </datalist>
                        </div>

                        <div className="form-group">
                            <label htmlFor="input-cc-last-four">Son 4 Hane</label>
                            <input
                                id="input-cc-last-four"
                                type="text"
                                maxLength={4}
                                placeholder="1234"
                                value={lastFour}
                                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="input-cc-limit">Toplam Kart Limiti (₺)</label>
                        <input
                            id="input-cc-limit"
                            type="number"
                            min="0"
                            step="100"
                            placeholder="50000"
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label htmlFor="select-cc-cutoff-day">Hesap Kesim Günü</label>
                            <select
                                id="select-cc-cutoff-day"
                                value={cutoffDay}
                                onChange={(e) => setCutoffDay(e.target.value)}
                                className="select-input"
                            >
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                    <option key={day} value={day}>Ayın {day}. günü</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Son Ödeme Kuralı</label>
                            <div className="auto-due-badge" id="badge-cc-auto-due">
                                <span>Otomatik (+10 Gün)</span>
                                <span className="auto-due-sub">Hafta sonuna gelirse ilk iş günü</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group" id="cc-color-palette-group">
                        <label>Kart Rengi</label>
                        <div className="color-palette-grid" id="cc-color-palette-grid">
                            {CARD_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    id={`btn-cc-color-${c.id}`}
                                    type="button"
                                    onClick={() => setColor(c.id)}
                                    className={`color-swatch-btn ${color === c.id ? 'active' : ''}`}
                                    style={{ background: c.bg }}
                                    title={c.name}
                                >
                                    {color === c.id && <Check size={14} color="#fff" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" id="btn-submit-credit-card" className="btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : editingCard ? 'Kartı Güncelle' : 'Kartı Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
