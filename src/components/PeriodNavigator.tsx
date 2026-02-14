'use client';

import { ChevronLeft, ChevronRight, CalendarDays, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodNavigatorProps {
    periodLabel: string;
    onPrevious: () => void;
    onNext: () => void;
    onCurrent: () => void;
    onAll: () => void;
    isAllView: boolean;
}

export default function PeriodNavigator({
    periodLabel,
    onPrevious,
    onNext,
    onCurrent,
    onAll,
    isAllView,
}: PeriodNavigatorProps) {
    return (
        <div className="period-nav">
            <div className="period-nav-buttons">
                <button onClick={onPrevious} className="nav-btn" title="Önceki Dönem">
                    <ChevronLeft size={18} />
                </button>
                <button onClick={onCurrent} className="nav-btn" title="Şu Anki Dönem">
                    <CalendarDays size={18} />
                </button>
                <button onClick={onNext} className="nav-btn" title="Sonraki Dönem">
                    <ChevronRight size={18} />
                </button>
                <button
                    onClick={onAll}
                    className={cn('nav-btn', isAllView && 'nav-btn-active')}
                    title="Tüm Süreç"
                >
                    <Infinity size={18} />
                </button>
            </div>
            <span className="period-label">{periodLabel}</span>
        </div>
    );
}
