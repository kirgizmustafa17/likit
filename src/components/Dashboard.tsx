'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Droplets, TrendingUp, TrendingDown, Wallet, CreditCard as CardIcon, BarChart3 } from 'lucide-react';
import { Transaction, CreditCard } from '@/lib/types';
import {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteTransactionGroup,
    markTransactionCompleted,
    getCreditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addCreditCardExpense,
} from '@/lib/actions';
import { calculateDailyBalances, getPeriodRange, formatCurrency, getTodayStr } from '@/lib/utils';
import { computeCardSummaries } from '@/lib/creditCardUtils';
import CashFlowChart from './CashFlowChart';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import PeriodNavigator from './PeriodNavigator';
import CompleteModal from './CompleteModal';
import CreditCardsView from './CreditCardsView';
import CreditCardModal from './CreditCardModal';

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [loading, setLoading] = useState(true);

    // Active View Tab: Cash Flow vs Credit Cards
    const [activeTab, setActiveTab] = useState<'cashflow' | 'credit_cards'>('cashflow');

    // Period / Chart state
    const [periodOffset, setPeriodOffset] = useState(0);
    const [isAllView, setIsAllView] = useState(false);

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [defaultCardId, setDefaultCardId] = useState<string | undefined>(undefined);

    const [completeTransaction, setCompleteTransaction] = useState<Transaction | null>(null);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [txnsData, cardsData] = await Promise.all([
                getTransactions(),
                getCreditCards(),
            ]);
            setTransactions(txnsData);
            setCards(cardsData);
        } catch (error) {
            console.error('Data load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-complete past-due transactions
    const autoCompleteTransactions = useCallback(async (txns: Transaction[]) => {
        const today = getTodayStr();
        const pastDue = txns.filter(t => !t.is_completed && t.transaction_date < today);

        if (pastDue.length === 0) return;

        for (const t of pastDue) {
            try {
                await markTransactionCompleted(t.id, today, t.amount);
            } catch (error) {
                console.error('Auto-complete error:', error);
            }
        }

        // Reload after auto-completing
        await loadData();
    }, [loadData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Trigger auto-complete when transactions change
    useEffect(() => {
        if (!loading && transactions.length > 0) {
            const today = getTodayStr();
            const hasPastDue = transactions.some(t => !t.is_completed && t.transaction_date < today);
            if (hasPastDue) {
                autoCompleteTransactions(transactions);
            }
        }
    }, [loading, transactions, autoCompleteTransactions]);

    // Calculate period range for cash flow
    const { chartStart: periodChartStart, chartEnd: periodChartEnd, label: periodLabel } = getPeriodRange(periodOffset);

    let chartStart = periodChartStart;
    let chartEnd = periodChartEnd;
    let displayLabel = periodLabel;

    if (isAllView && transactions.length > 0) {
        const allDates = transactions.map(t => {
            const effectiveDate = t.is_completed && t.completed_date ? t.completed_date : t.transaction_date;
            return new Date(effectiveDate);
        });
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        chartStart = new Date(minDate);
        chartStart.setDate(chartStart.getDate() - 5);
        chartEnd = new Date(maxDate);
        chartEnd.setDate(chartEnd.getDate() + 10);
        displayLabel = 'Tüm Süreç';
    }

    // Chart daily balances
    const chartData = calculateDailyBalances(transactions, chartStart, chartEnd);

    // Summary stats for cash flow
    const currentBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
    const todayStr = getTodayStr();
    const todayData = chartData.find(d => d.date === todayStr);
    const todayBalance = todayData ? todayData.balance : currentBalance;

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.is_completed && t.completed_amount != null ? t.completed_amount : t.amount), 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.is_completed && t.completed_amount != null ? t.completed_amount : t.amount), 0);

    // Card summaries
    const cardSummaries = computeCardSummaries(cards, transactions);

    // Handlers
    const handleAddTransaction = async (data: {
        title: string;
        amount: number;
        transaction_date: string;
        type: 'income' | 'expense';
        is_completed: boolean;
        card_id?: string | null;
        purchase_date?: string | null;
        total_installments?: number;
        completed_date?: string | null;
        completed_amount?: number | null;
    }) => {
        try {
            if (data.card_id && data.type === 'expense') {
                const card = cards.find(c => c.id === data.card_id);
                if (card) {
                    await addCreditCardExpense({
                        title: data.title,
                        totalAmount: data.amount,
                        purchaseDate: data.purchase_date || data.transaction_date,
                        totalInstallments: data.total_installments || 1,
                        card,
                    });
                } else {
                    await addTransaction(data);
                }
            } else {
                await addTransaction(data);
            }
            await loadData();
            setIsFormOpen(false);
            setDefaultCardId(undefined);
        } catch (error) {
            console.error('Add transaction error:', error);
        }
    };

    const handleUpdateTransaction = async (id: string, data: Partial<Transaction>) => {
        try {
            await updateTransaction(id, data);
            await loadData();
            setIsFormOpen(false);
            setEditingTransaction(null);
            setDefaultCardId(undefined);
        } catch (error) {
            console.error('Update transaction error:', error);
        }
    };

    const handleDeleteTransaction = async (id: string, transaction?: Transaction) => {
        const txn = transaction || transactions.find(t => t.id === id);
        if (txn?.parent_transaction_id && txn?.total_installments && txn.total_installments > 1) {
            const deleteAll = confirm(
                `"${txn.title}" işlemi ${txn.total_installments} taksitli bir harcamanın parçasıdır (${txn.installment_no}/${txn.total_installments}).\n\n• TÜM taksitleri silmek için: "Tamam"\n• Yalnızca BU taksiti silmek için: "İptal"`
            );
            try {
                if (deleteAll) {
                    await deleteTransactionGroup(txn.parent_transaction_id);
                } else {
                    const confirmSingle = confirm(`Yalnızca bu taksiti (${txn.installment_no}. taksit) silmek istediğinize emin misiniz?`);
                    if (!confirmSingle) return;
                    await deleteTransaction(id);
                }
                await loadData();
            } catch (error) {
                console.error('Delete transaction error:', error);
            }
            return;
        }

        if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteTransaction(id);
            await loadData();
        } catch (error) {
            console.error('Delete transaction error:', error);
        }
    };

    const handleMarkComplete = async (id: string, completedDate: string, completedAmount: number) => {
        try {
            await markTransactionCompleted(id, completedDate, completedAmount);
            await loadData();
            setIsCompleteModalOpen(false);
            setCompleteTransaction(null);
        } catch (error) {
            console.error('Complete transaction error:', error);
        }
    };

    const openEditForm = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setDefaultCardId(transaction.card_id || undefined);
        setIsFormOpen(true);
    };

    const openCompleteModal = (transaction: Transaction) => {
        setCompleteTransaction(transaction);
        setIsCompleteModalOpen(true);
    };

    // Credit Card Handlers
    const handleAddCard = async (cardData: Omit<CreditCard, 'id' | 'created_at'>) => {
        await addCreditCard(cardData);
        await loadData();
    };

    const handleUpdateCard = async (id: string, updates: Partial<CreditCard>) => {
        await updateCreditCard(id, updates);
        await loadData();
        setEditingCard(null);
    };

    const handleDeleteCard = async (id: string) => {
        try {
            await deleteCreditCard(id);
            await loadData();
        } catch (error) {
            console.error('Delete card error:', error);
        }
    };

    const handleOpenExpenseForCard = (cardId?: string) => {
        setEditingTransaction(null);
        setDefaultCardId(cardId || (cards[0]?.id || undefined));
        setIsFormOpen(true);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="header">
                <div className="header-left">
                    <div className="logo">
                        <Droplets size={28} className="logo-icon" />
                        <h1>Likit</h1>
                    </div>
                    <p className="header-subtitle">Nakit Akış & Finans Takibi</p>
                </div>

                <div className="header-nav-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'cashflow' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cashflow')}
                    >
                        <BarChart3 size={16} />
                        <span>Nakit Akışı</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'credit_cards' ? 'active' : ''}`}
                        onClick={() => setActiveTab('credit_cards')}
                    >
                        <CardIcon size={16} />
                        <span>Kredi Kartları</span>
                        {cards.length > 0 && <span className="tab-badge">{cards.length}</span>}
                    </button>
                </div>

                <div className="header-actions">
                    {activeTab === 'cashflow' ? (
                        <button
                            onClick={() => {
                                setEditingTransaction(null);
                                setDefaultCardId(undefined);
                                setIsFormOpen(true);
                            }}
                            className="btn-add"
                        >
                            <Plus size={20} />
                            <span>Yeni İşlem</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setEditingCard(null);
                                setIsCardModalOpen(true);
                            }}
                            className="btn-add"
                        >
                            <Plus size={20} />
                            <span>Yeni Kart</span>
                        </button>
                    )}
                </div>
            </header>

            {/* View Switch */}
            {activeTab === 'cashflow' ? (
                <>
                    {/* Cash Flow Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card stat-balance">
                            <div className="stat-icon-wrap">
                                <Wallet size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Bugünkü Bakiye</span>
                                <span className={`stat-value ${todayBalance >= 0 ? 'positive' : 'negative'}`}>
                                    {formatCurrency(todayBalance)}
                                </span>
                            </div>
                        </div>
                        <div className="stat-card stat-income">
                            <div className="stat-icon-wrap">
                                <TrendingUp size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Toplam Gelir</span>
                                <span className="stat-value positive">{formatCurrency(totalIncome)}</span>
                            </div>
                        </div>
                        <div className="stat-card stat-expense">
                            <div className="stat-icon-wrap">
                                <TrendingDown size={20} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Toplam Gider</span>
                                <span className="stat-value negative">{formatCurrency(totalExpense)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Period Navigator */}
                    <PeriodNavigator
                        periodLabel={displayLabel}
                        onPrevious={() => { setIsAllView(false); setPeriodOffset(prev => prev - 1); }}
                        onNext={() => { setIsAllView(false); setPeriodOffset(prev => prev + 1); }}
                        onCurrent={() => { setIsAllView(false); setPeriodOffset(0); }}
                        onAll={() => setIsAllView(true)}
                        isAllView={isAllView}
                    />

                    {/* Chart */}
                    <CashFlowChart data={chartData} periodLabel={displayLabel} />

                    {/* Transaction List with Credit Cards support */}
                    <TransactionList
                        transactions={(() => {
                            const planned = transactions.filter(t => !t.is_completed);
                            const startStr = `${chartStart.getFullYear()}-${String(chartStart.getMonth() + 1).padStart(2, '0')}-${String(chartStart.getDate()).padStart(2, '0')}`;
                            const endStr = `${chartEnd.getFullYear()}-${String(chartEnd.getMonth() + 1).padStart(2, '0')}-${String(chartEnd.getDate()).padStart(2, '0')}`;
                            const completed = transactions.filter(t => {
                                if (!t.is_completed) return false;
                                const effectiveDate = t.completed_date || t.transaction_date;
                                return effectiveDate >= startStr && effectiveDate <= endStr;
                            });
                            return [...planned, ...completed];
                        })()}
                        cards={cards}
                        onEdit={openEditForm}
                        onDelete={handleDeleteTransaction}
                        onMarkComplete={openCompleteModal}
                    />
                </>
            ) : (
                /* Credit Cards View */
                <CreditCardsView
                    cards={cardSummaries}
                    transactions={transactions}
                    onAddCard={() => {
                        setEditingCard(null);
                        setIsCardModalOpen(true);
                    }}
                    onEditCard={(card) => {
                        setEditingCard(card);
                        setIsCardModalOpen(true);
                    }}
                    onDeleteCard={handleDeleteCard}
                    onAddExpense={handleOpenExpenseForCard}
                    onMarkComplete={openCompleteModal}
                    onEditTransaction={openEditForm}
                    onDeleteTransaction={handleDeleteTransaction}
                />
            )}

            {/* Modals */}
            <TransactionForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTransaction(null);
                    setDefaultCardId(undefined);
                }}
                onSubmit={handleAddTransaction}
                editingTransaction={editingTransaction}
                onUpdate={handleUpdateTransaction}
                cards={cards}
                defaultCardId={defaultCardId}
            />

            <CompleteModal
                isOpen={isCompleteModalOpen}
                onClose={() => {
                    setIsCompleteModalOpen(false);
                    setCompleteTransaction(null);
                }}
                transaction={completeTransaction}
                onComplete={handleMarkComplete}
            />

            <CreditCardModal
                isOpen={isCardModalOpen}
                onClose={() => {
                    setIsCardModalOpen(false);
                    setEditingCard(null);
                }}
                onSubmit={handleAddCard}
                editingCard={editingCard}
                onUpdate={handleUpdateCard}
            />
        </div>
    );
}
