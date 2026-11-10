'use client';

import { useState } from 'react';
import {
    Plus,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    Edit3,
    Trash2,
    Home,
    Briefcase,
    Zap,
    Building2,
    Coins,
    Repeat,
    Tag,
} from 'lucide-react';
import { RecurringRule, RecurringCategory, CreditCard } from '@/lib/types';
import { RECURRING_CATEGORIES, computeRecurringSummary, getCategoryLabel, getCategoryIcon } from '@/lib/recurringUtils';
import { formatCurrency, cn } from '@/lib/utils';

interface RecurringTransactionsViewProps {
    rules: RecurringRule[];
    cards?: CreditCard[];
    onAddRule: () => void;
    onEditRule: (rule: RecurringRule) => void;
    onDeleteRule: (id: string, rule: RecurringRule) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onSyncAll: () => Promise<void>;
}

export default function RecurringTransactionsView({
    rules,
    cards = [],
    onAddRule,
    onEditRule,
    onDeleteRule,
    onToggleActive,
    onSyncAll,
}: RecurringTransactionsViewProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [syncing, setSyncing] = useState(false);

    const summary = computeRecurringSummary(rules);

    const filteredRules = rules.filter((r) => {
        if (selectedCategory === 'all') return true;
        return r.category === selectedCategory;
    });

    const handleSync = async () => {
        setSyncing(true);
        try {
            await onSyncAll();
        } finally {
            setSyncing(false);
        }
    };

    const getCategoryIconComponent = (cat: RecurringCategory) => {
        switch (cat) {
            case 'rent':
                return Home;
            case 'salary':
                return Briefcase;
            case 'bill':
                return Zap;
            case 'dues':
                return Building2;
            case 'extra_income':
                return Coins;
            case 'subscription':
                return Repeat;
            default:
                return Tag;
        }
    };

    return (
        <div className="recurring-view-container" id="recurring-view-container">
            {/* Top Summary Stats */}
            <div className="stats-grid" id="recurring-stats-grid">
                <div className="stat-card stat-income" id="stat-recurring-income">
                    <div className="stat-icon-wrap">
                        <TrendingUp size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Aylık Düzenli Gelir</span>
                        <span className="stat-value positive" id="stat-recurring-income-value">
                            {formatCurrency(summary.total_monthly_income)}
                            <small className="stat-unit"> / ay</small>
                        </span>
                    </div>
                </div>

                <div className="stat-card stat-expense" id="stat-recurring-expense">
                    <div className="stat-icon-wrap">
                        <TrendingDown size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Aylık Düzenli Gider</span>
                        <span className="stat-value negative" id="stat-recurring-expense-value">
                            {formatCurrency(summary.total_monthly_expense)}
                            <small className="stat-unit"> / ay</small>
                        </span>
                    </div>
                </div>

                <div className="stat-card stat-balance" id="stat-recurring-net">
                    <div className="stat-icon-wrap">
                        <Wallet size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Net Sabit Akış (Tasarruf Gücü)</span>
                        <span
                            className={cn(
                                'stat-value',
                                summary.net_monthly_flow >= 0 ? 'positive' : 'negative'
                            )}
                            id="stat-recurring-net-value"
                        >
                            {formatCurrency(summary.net_monthly_flow)}
                            <small className="stat-unit"> / ay</small>
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="cc-actions-bar" id="recurring-actions-bar">
                <div className="cc-actions-title-wrap">
                    <h2 id="recurring-actions-title">Düzenli Gelir &amp; Gider Kuralları</h2>
                    <span className="transaction-count" id="recurring-rules-count">
                        {rules.length} kural
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        id="btn-sync-recurring"
                        className="btn-secondary"
                        onClick={handleSync}
                        disabled={syncing}
                        title="İleriye dönük 12 aylık işlemleri yeniden senkronize et"
                    >
                        <RefreshCw size={16} className={cn(syncing && 'animate-spin')} />
                        <span>{syncing ? 'Senkronize ediliyor...' : 'Şimdi Senkronize Et'}</span>
                    </button>
                    <button
                        type="button"
                        id="btn-add-recurring"
                        className="btn-primary"
                        onClick={onAddRule}
                    >
                        <Plus size={18} />
                        <span>Yeni Düzenli İşlem</span>
                    </button>
                </div>
            </div>

            {/* Category Filter Chips */}
            <div className="cc-filter-tabs" id="recurring-category-filters" style={{ marginBottom: '20px' }}>
                <button
                    type="button"
                    id="btn-filter-recurring-all"
                    className={cn('cc-filter-tab', selectedCategory === 'all' && 'active')}
                    onClick={() => setSelectedCategory('all')}
                >
                    Tümü ({rules.length})
                </button>
                {Object.entries(RECURRING_CATEGORIES).map(([key, meta]) => {
                    const count = rules.filter((r) => r.category === key).length;
                    return (
                        <button
                            key={key}
                            type="button"
                            id={`btn-filter-recurring-${key}`}
                            className={cn('cc-filter-tab', selectedCategory === key && 'active')}
                            onClick={() => setSelectedCategory(key)}
                        >
                            <span style={{ marginRight: '5px' }}>{meta.icon}</span>
                            <span>
                                {meta.label} {count > 0 && `(${count})`}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Rules List or Empty State */}
            {filteredRules.length === 0 ? (
                <div className="transaction-empty" id="recurring-empty-state">
                    <Repeat size={40} className="text-muted" style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>
                        {selectedCategory === 'all'
                            ? 'Henüz düzenli gelir veya gider kuralı eklemediniz.'
                            : 'Bu kategoride düzenli işlem bulunmuyor.'}
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '6px' }}>
                        Kira, maaş, faturalar veya aidat gibi tekrarlayan ödemelerinizi ekleyerek nakit akışınızı 12 ay ileriye dönük otomatik planlayabilirsiniz.
                    </p>
                    <button
                        type="button"
                        className="btn-primary"
                        style={{ marginTop: '16px' }}
                        onClick={onAddRule}
                    >
                        <Plus size={16} />
                        <span>İlk Düzenli İşlemi Ekle</span>
                    </button>
                </div>
            ) : (
                <div className="recurring-rules-grid" id="recurring-rules-grid">
                    {filteredRules.map((rule) => {
                        const isIncome = rule.type === 'income';
                        const card = rule.card || (rule.card_id ? cards.find((c) => c.id === rule.card_id) : null);
                        const IconComp = getCategoryIconComponent(rule.category);

                        return (
                            <div
                                key={rule.id}
                                id={`recurring-rule-card-${rule.id}`}
                                className={cn('recurring-rule-card', !rule.is_active && 'rule-inactive')}
                            >
                                <div className="recurring-rule-left">
                                    <div className={cn('recurring-icon-wrap', isIncome ? 'income-icon' : 'expense-icon')}>
                                        <IconComp size={20} />
                                    </div>
                                    <div className="recurring-rule-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className="recurring-rule-title" id={`recurring-title-${rule.id}`}>
                                                {rule.title}
                                            </span>
                                            <span className="recurring-tag-badge">
                                                {getCategoryIcon(rule.category)} {getCategoryLabel(rule.category)}
                                            </span>
                                            {card && (
                                                <span className="cc-tag-badge">
                                                    💳 {card.name}
                                                </span>
                                            )}
                                            {!rule.is_active && (
                                                <span className="badge-paused">
                                                    Durduruldu
                                                </span>
                                            )}
                                        </div>

                                        <div className="recurring-rule-meta">
                                            <span className="recurring-meta-item">
                                                <Calendar size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                                                Her ayın {rule.day_of_month}. günü
                                            </span>
                                            <span className="recurring-meta-item">
                                                {rule.frequency === 'monthly' ? 'Aylık' : rule.frequency === 'weekly' ? 'Haftalık' : 'Yıllık'}
                                            </span>
                                            {rule.end_date && (
                                                <span className="recurring-meta-item text-muted">
                                                    Bitiş: {rule.end_date}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="recurring-rule-right">
                                    <div className="recurring-rule-amount-wrap">
                                        <span
                                            id={`recurring-amount-${rule.id}`}
                                            className={cn('recurring-rule-amount', isIncome ? 'positive' : 'negative')}
                                        >
                                            {isIncome ? '+' : '-'}{formatCurrency(rule.amount)}
                                        </span>
                                        <span className="recurring-rule-unit">/ ay</span>
                                    </div>

                                    <div className="recurring-rule-actions">
                                        {/* Toggle Active Switch */}
                                        <button
                                            type="button"
                                            id={`switch-recurring-${rule.id}`}
                                            className={cn('btn-icon', rule.is_active ? 'text-primary' : 'text-muted')}
                                            onClick={() => onToggleActive(rule.id, !rule.is_active)}
                                            title={rule.is_active ? 'Kuralı durdur (Pasif yap)' : 'Kuralı aktifleştir'}
                                        >
                                            <Repeat size={18} />
                                        </button>

                                        {/* Edit */}
                                        <button
                                            type="button"
                                            id={`btn-edit-recurring-${rule.id}`}
                                            className="btn-icon"
                                            onClick={() => onEditRule(rule)}
                                            title="Düzenle"
                                        >
                                            <Edit3 size={18} />
                                        </button>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            id={`btn-delete-recurring-${rule.id}`}
                                            className="btn-icon btn-delete"
                                            onClick={() => onDeleteRule(rule.id, rule)}
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
