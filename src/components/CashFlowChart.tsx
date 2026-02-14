'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { DailyBalance } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CashFlowChartProps {
    data: DailyBalance[];
    periodLabel: string;
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        return (
            <div className="chart-tooltip">
                <p className="chart-tooltip-date">{label}</p>
                <p className={`chart-tooltip-value ${value >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(value)}
                </p>
            </div>
        );
    }
    return null;
}

export default function CashFlowChart({ data, periodLabel }: CashFlowChartProps) {
    if (data.length === 0) {
        return (
            <div className="chart-container">
                <div className="chart-header">
                    <h2>Nakit Akışı</h2>
                    <span className="chart-period">{periodLabel}</span>
                </div>
                <div className="chart-empty">
                    <p>Henüz işlem yok. Grafik görmek için işlem ekleyin.</p>
                </div>
            </div>
        );
    }

    const minBalance = Math.min(...data.map(d => d.balance));
    const maxBalance = Math.max(...data.map(d => d.balance));
    const padding = Math.max(Math.abs(maxBalance - minBalance) * 0.1, 1000);

    // Find today's date index
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayIndex = data.findIndex(d => d.date === todayStr);

    // Determine gradient ID based on min balance
    const hasNegative = minBalance < 0;

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h2>Nakit Akışı</h2>
                <span className="chart-period">{periodLabel}</span>
            </div>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="balanceGradientNeg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="60%" stopColor="#ef4444" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                            dataKey="label"
                            stroke="rgba(255,255,255,0.4)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            interval={Math.max(Math.floor(data.length / 10), 1)}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.4)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
                            domain={[minBalance - padding, maxBalance + padding]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {hasNegative && (
                            <ReferenceLine y={0} stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="5 5" />
                        )}
                        {todayIndex >= 0 && (
                            <ReferenceLine
                                x={data[todayIndex]?.label}
                                stroke="rgba(99, 102, 241, 0.7)"
                                strokeDasharray="4 4"
                                label={{
                                    value: 'Bugün',
                                    position: 'top',
                                    fill: 'rgba(99, 102, 241, 0.9)',
                                    fontSize: 11,
                                }}
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#818cf8"
                            strokeWidth={2.5}
                            fill={hasNegative ? 'url(#balanceGradientNeg)' : 'url(#balanceGradient)'}
                            dot={false}
                            activeDot={{
                                r: 5,
                                stroke: '#818cf8',
                                strokeWidth: 2,
                                fill: '#1e1b4b',
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
