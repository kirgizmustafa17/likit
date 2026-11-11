'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, Check, Sparkles, Star } from 'lucide-react';
import { CreditCard, CardNetwork } from '@/lib/types';
import {
    CARD_NETWORKS,
    getColorsForNetwork,
    getCardColorTheme,
    cleanCardName,
} from '@/lib/creditCardUtils';
import CardNetworkBadge from './CardNetworkBadge';

interface CreditCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (cardData: Omit<CreditCard, 'id' | 'created_at'>) => Promise<void>;
    editingCard?: CreditCard | null;
    onUpdate?: (id: string, updates: Partial<CreditCard>) => Promise<void>;
}

export const POPULAR_BANKS = [
    'Garanti BBVA',
    'İş Bankası',
    'Yapı Kredi',
    'Akbank',
    'QNB',
    'Enpara',
    'Ziraat Bankası',
    'Vakıfbank',
    'Kuveyt Türk',
    'TEB',
];

export default function CreditCardModal({
    isOpen,
    onClose,
    onSubmit,
    editingCard,
    onUpdate,
}: CreditCardModalProps) {
    const [name, setName] = useState('');
    const [network, setNetwork] = useState<CardNetwork>('other');
    const [bankName, setBankName] = useState('');
    const [lastFour, setLastFour] = useState('');
    const [creditLimit, setCreditLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('15');
    const [color, setColor] = useState('indigo');
    const [isDefault, setIsDefault] = useState(false);
    const [saving, setSaving] = useState(false);
    const [nameCleanSuggestion, setNameCleanSuggestion] = useState<string | null>(null);

    useEffect(() => {
        if (editingCard) {
            setName(editingCard.name || '');
            setNetwork(editingCard.card_network || 'other');
            setBankName(editingCard.bank_name || '');
            setLastFour(editingCard.last_four_digits || '');
            setCreditLimit(editingCard.credit_limit ? String(editingCard.credit_limit) : '0');
            setCutoffDay(String(editingCard.cutoff_day || 15));
            setColor(editingCard.color || 'indigo');
            setIsDefault(Boolean(editingCard.is_default));
            setNameCleanSuggestion(null);
        } else {
            setName('');
            setNetwork('other');
            setBankName('Garanti BBVA');
            setLastFour('');
            setCreditLimit('50000');
            setCutoffDay('15');
            setColor('indigo');
            setIsDefault(false);
            setNameCleanSuggestion(null);
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

    // Handle name input change with smart network auto-detection
    const handleNameChange = (val: string) => {
        setName(val);
        const { cleanName, detectedNetwork } = cleanCardName(val);

        if (detectedNetwork !== 'other' && detectedNetwork !== network) {
            setNetwork(detectedNetwork);
            // Suggest clean name if it stripped something
            if (cleanName !== val) {
                setNameCleanSuggestion(cleanName);
            }
            // Auto update color to network default if not customized yet
            const netDef = CARD_NETWORKS.find(n => n.id === detectedNetwork);
            if (netDef) {
                setColor(netDef.defaultColor);
            }
        } else if (cleanName !== val && detectedNetwork !== 'other') {
            setNameCleanSuggestion(cleanName);
        } else {
            setNameCleanSuggestion(null);
        }
    };

    // Apply the clean name suggestion
    const applyCleanName = () => {
        if (nameCleanSuggestion) {
            setName(nameCleanSuggestion);
            setNameCleanSuggestion(null);
        }
    };

    // Explicit network selector click
    const handleSelectNetwork = (newNet: CardNetwork) => {
        setNetwork(newNet);
        const netDef = CARD_NETWORKS.find(n => n.id === newNet);
        if (netDef) {
            setColor(netDef.defaultColor);
        }
        // If current name has old network keyword, clean it
        if (name) {
            const { cleanName } = cleanCardName(name);
            if (cleanName && cleanName !== name) {
                setName(cleanName);
                setNameCleanSuggestion(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setSaving(true);
        try {
            const cutoffNum = Math.min(31, Math.max(1, parseInt(cutoffDay, 10) || 1));
            const autoDueDay = cutoffNum + 10 > 30 ? (cutoffNum + 10 - 30) : (cutoffNum + 10);
            
            // Clean name if pending
            const finalName = nameCleanSuggestion || name.trim();

            const cardData = {
                name: finalName,
                card_network: network,
                bank_name: bankName || null,
                last_four_digits: lastFour ? lastFour.slice(0, 4) : null,
                credit_limit: parseFloat(creditLimit) || 0,
                cutoff_day: cutoffNum,
                due_day: autoDueDay,
                color,
                is_active: true,
                is_default: isDefault,
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

    const activeColorObj = getCardColorTheme(color, network);
    const availableColors = getColorsForNetwork(network);

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
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <CardNetworkBadge network={network} variant="card" />
                            <div className="card-preview-val" id="vcc-preview-cutoff" style={{ fontSize: '11px', opacity: 0.85 }}>
                                Kesim: {cutoffDay}. gün
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form" id="form-credit-card" style={{ marginTop: '16px' }}>
                    {/* Payment Network Selector */}
                    <div className="form-group" id="group-cc-network">
                        <label>Ödeme Ağı (Kart Etiketi)</label>
                        <div className="network-selector-grid" id="network-selector-grid">
                            {CARD_NETWORKS.map(net => {
                                const isSelected = network === net.id;
                                return (
                                    <button
                                        key={net.id}
                                        id={`btn-network-${net.id}`}
                                        type="button"
                                        onClick={() => handleSelectNetwork(net.id)}
                                        className={`network-select-btn ${isSelected ? 'active' : ''}`}
                                    >
                                        <CardNetworkBadge network={net.id} variant="icon" />
                                        <span className="network-name">{net.name}</span>
                                        {isSelected && <Check size={13} className="network-check" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="input-cc-name">Kart İsmi / Tanımı</label>
                        <input
                            id="input-cc-name"
                            type="text"
                            placeholder="Örn: Bonus Gold, Maximum, Axess"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            autoFocus
                        />
                        {nameCleanSuggestion && (
                            <div className="name-clean-banner" id="name-clean-banner">
                                <Sparkles size={13} />
                                <span>Ağ etiketi algılandı: Kart adını <strong>&quot;{nameCleanSuggestion}&quot;</strong> olarak sadeleştirilsin mi?</span>
                                <button type="button" onClick={applyCleanName} className="btn-clean-apply">
                                    Sadeleştir
                                </button>
                            </div>
                        )}
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

                    {/* Color Themes Palette */}
                    <div className="form-group" id="cc-color-palette-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Kart Renk Teması</label>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {activeColorObj.name}
                            </span>
                        </div>
                        <div className="color-palette-grid" id="cc-color-palette-grid">
                            {availableColors.map(c => {
                                const isCurrent = color === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        id={`btn-cc-color-${c.id}`}
                                        type="button"
                                        onClick={() => setColor(c.id)}
                                        className={`color-swatch-btn ${isCurrent ? 'active' : ''}`}
                                        style={{ background: c.bg, border: `2px solid ${c.border}` }}
                                        title={`${c.name} (${c.network ? c.network.toUpperCase() : 'Genel'})`}
                                    >
                                        {isCurrent && <Check size={14} color="#fff" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Default Card Checkbox */}
                    <div className="form-group" style={{ marginTop: '12px', marginBottom: '8px' }}>
                        <label className="checkbox-label" id="label-cc-default">
                            <input
                                id="checkbox-cc-default"
                                type="checkbox"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Star
                                    size={15}
                                    fill={isDefault ? '#f59e0b' : 'none'}
                                    color={isDefault ? '#f59e0b' : 'var(--text-muted)'}
                                />
                                <span>Varsayılan Harcama Kartı Yap</span>
                            </div>
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '3px', marginLeft: '26px' }}>
                            Yeni harcama eklerken bu kart otomatik olarak seçili gelecektir.
                        </span>
                    </div>

                    <button type="submit" id="btn-submit-credit-card" className="btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : editingCard ? 'Kartı Güncelle' : 'Kartı Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
