'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Droplets, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, markTransactionCompleted } from '@/lib/actions';
import { calculateDailyBalances, getPeriodRange, formatCurrency } from '@/lib/utils';
import CashFlowChart from './CashFlowChart';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import PeriodNavigator from './PeriodNavigator';
import CompleteModal from './CompleteModal';

export default function Dashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodOffset, setPeriodOffset] = useState(0);
    const [isAllView, setIsAllView] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [completeTransaction, setCompleteTransaction] = useState<Transaction | null>(null);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

    const loadTransactions = useCallback(async () => {
        try {
            const data = await getTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Transactions load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Calculate period range
    const { start: periodStart, end: periodEnd, label: periodLabel } = getPeriodRange(periodOffset);

    // For "All" view, find min/max dates across all transactions
    let chartStart = periodStart;
    let chartEnd = periodEnd;
    let displayLabel = periodLabel;

    if (isAllView && transactions.length > 0) {
        const allDates = transactions.map(t => {
            const effectiveDate = t.is_completed && t.completed_date ? t.completed_date : t.transaction_date;
            return new Date(effectiveDate);
        });
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        // Add some padding
        chartStart = new Date(minDate);
        chartStart.setDate(chartStart.getDate() - 5);
        chartEnd = new Date(maxDate);
        chartEnd.setDate(chartEnd.getDate() + 10);
        displayLabel = 'Tüm Süreç';
    }

    // Calculate chart data
    const chartData = calculateDailyBalances(transactions, chartStart, chartEnd);

    // Calculate summary stats
    const currentBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayData = chartData.find(d => d.date === todayStr);
    const todayBalance = todayData ? todayData.balance : currentBalance;

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.is_completed && t.completed_amount != null ? t.completed_amount : t.amount), 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.is_completed && t.completed_amount != null ? t.completed_amount : t.amount), 0);

    // Transaction handlers
    const handleAddTransaction = async (data: {
        title: string;
        amount: number;
        transaction_date: string;
        type: 'income' | 'expense';
        is_completed: boolean;
    }) => {
        try {
            await addTransaction(data);
            await loadTransactions();
            setIsFormOpen(false);
        } catch (error) {
            console.error('Add error:', error);
        }
    };

    const handleUpdateTransaction = async (id: string, data: Partial<Transaction>) => {
        try {
            await updateTransaction(id, data);
            await loadTransactions();
            setIsFormOpen(false);
            setEditingTransaction(null);
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;
        try {
            await deleteTransaction(id);
            await loadTransactions();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleMarkComplete = async (id: string, completedDate: string, completedAmount: number) => {
        try {
            await markTransactionCompleted(id, completedDate, completedAmount);
            await loadTransactions();
            setIsCompleteModalOpen(false);
            setCompleteTransaction(null);
        } catch (error) {
            console.error('Complete error:', error);
        }
    };

    const openEditForm = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsFormOpen(true);
    };

    const openCompleteModal = (transaction: Transaction) => {
        setCompleteTransaction(transaction);
        setIsCompleteModalOpen(true);
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
                    <p className="header-subtitle">Nakit Akış Takibi</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTransaction(null);
                        setIsFormOpen(true);
                    }}
                    className="btn-add"
                >
                    <Plus size={20} />
                    <span>Yeni İşlem</span>
                </button>
            </header>

            {/* Stats Cards */}
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

            {/* Transaction List */}
            <TransactionList
                transactions={transactions}
                onEdit={openEditForm}
                onDelete={handleDeleteTransaction}
                onMarkComplete={openCompleteModal}
            />

            {/* Modals */}
            <TransactionForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingTransaction(null);
                }}
                onSubmit={handleAddTransaction}
                editingTransaction={editingTransaction}
                onUpdate={handleUpdateTransaction}
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
        </div>
    );
}
