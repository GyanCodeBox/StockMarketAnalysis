import React, { useMemo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg">
                <p className="text-slate-300 font-bold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                        {entry.unit || '%'}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const EPSTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg">
                <p className="text-slate-300 font-bold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const FinancialCharts = ({ data }) => {
    if (!data || !data.quarterly || data.quarterly.length === 0) {
        return null;
    }

    // Prepare data: Recharts needs ascending order for time axis
    const chartData = useMemo(() => {
        return [...data.quarterly].reverse().map(item => ({
            ...item,
            periodLabel: `${item.period} ${item.calendarYear}`,
        }));
    }, [data]);

    return (
        <div className="space-y-6">
            {/* Chart 1: Growth Momentum (EPS QoQ vs Sales QoQ) */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">1. Growth Momentum (QoQ)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="periodLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#4b5563' }}
                            />
                            <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'Growth %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Line
                                type="monotone"
                                dataKey="eps_qoq"
                                name="EPS Growth QoQ"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#10b981' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sales_qoq"
                                name="Sales Growth QoQ"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#6366f1' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Net Margin Trend */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">2. Net Profit Margin Trend</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="periodLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#4b5563' }}
                            />
                            <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'Margin %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Area
                                type="monotone"
                                dataKey="net_margin"
                                name="Net Margin"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#colorMargin)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 3: Quality of Earnings (Other Income %) */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">3. Quality of Earnings (Other Income %)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="periodLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#4b5563' }}
                            />
                            <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'Other Income %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Bar
                                dataKey="other_income_pct"
                                name="Other Income as % of Net Income"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 4: Smoothed Performance (Rolling 2Q Growth %) */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">4. Smoothed Performance (2Q Rolling Growth %)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="periodLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#4b5563' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'EPS Growth %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'Sales Growth %', angle: 90, position: 'insideRight', fill: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="eps_rolling_2q_growth"
                                name="2Q Rolling EPS Growth"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#10b981' }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="sales_rolling_2q_growth"
                                name="2Q Rolling Revenue Growth"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#3b82f6' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 5: EPS Breakout (Line Chart) */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">5. EPS Breakout Pattern</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <defs>
                                <linearGradient id="colorEPS" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="periodLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#4b5563' }}
                            />
                            <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'EPS', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                            />
                            <Tooltip content={<EPSTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Area
                                type="monotone"
                                dataKey="eps"
                                name="EPS"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorEPS)"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 6: ROCE Trend */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-slate-200 mb-6">6. ROCE Trend</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis
                                dataKey="periodLabel"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#4b5563' }}
                            />
                            <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563' }}
                                label={{ value: 'ROCE %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            <Line
                                type="monotone"
                                dataKey="roce"
                                name="ROCE %"
                                stroke="#ec4899"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#ec4899' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default FinancialCharts;
