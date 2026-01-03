import React, { useMemo, useState } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Area, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import { Info, BarChart3, Table as TableIcon, ChartBar, LayoutGrid, History } from 'lucide-react';

// --- Shared Components ---

const SectionCard = ({ title, icon, chart, table, interpretation, dataForTable }) => {
    const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'data'
    const [showFullHistory, setShowFullHistory] = useState(false);

    const displayTable = useMemo(() => {
        if (!dataForTable) return null;
        return showFullHistory ? dataForTable : dataForTable.slice(0, 8);
    }, [dataForTable, showFullHistory]);

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                <div className="flex items-center gap-3">
                    <span className="text-indigo-400">{icon}</span>
                    <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">{title}</h3>
                </div>

                <div className="flex items-center gap-3">
                    {viewMode === 'data' && (
                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner mr-2">
                            <button
                                onClick={() => setShowFullHistory(false)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${!showFullHistory ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                            >
                                RECENT
                            </button>
                            <button
                                onClick={() => setShowFullHistory(true)}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${showFullHistory ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                            >
                                FULL
                            </button>
                        </div>
                    )}
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'chart' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Chart View"
                        >
                            <ChartBar size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('data')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Data View"
                        >
                            <TableIcon size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
                {viewMode === 'chart' ? (
                    <div className="space-y-4">
                        {interpretation && (
                            <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                                <Info size={12} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                                <p className={`text-[10px] font-bold tracking-tight uppercase ${interpretation.color || 'text-slate-400'}`}>
                                    {interpretation.text}
                                </p>
                            </div>
                        )}
                        <div className="h-[300px] w-full">
                            {chart}
                        </div>
                    </div>
                ) : (
                    <div className="h-[340px] overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {React.cloneElement(table, { data: displayTable })}
                    </div>
                )}
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label, suffix = '%' }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg">
                <p className="text-slate-300 font-bold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                        {suffix}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const MiniTable = ({ columns, data, highlightCol = '' }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* We add a min-width to ensure the table doesn't collapse too much */}
            <table className="w-full text-left border-collapse min-w-max text-sm">
                <tbody className="divide-y divide-slate-800/50">
                    {columns.map((col, cIdx) => (
                        <tr key={cIdx} className="hover:bg-indigo-500/5 transition-colors group">
                            {/* Row Header (Metric Name) - Sticky Left */}
                            <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800/50 bg-slate-950 sticky left-0 z-20 w-32 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.5)]">
                                {col.label}
                            </th>

                            {/* Data Cells (Time Periods) */}
                            {data.map((row, rIdx) => {
                                const val = row[col.key];
                                const isHighlight = highlightCol === col.key;

                                // Apply custom color logic or default highlighting
                                const colorClass = col.getColor
                                    ? col.getColor(val, row)
                                    : (isHighlight ? 'text-indigo-400 font-bold' : 'text-slate-400');

                                // Special styling for the 'Quarter' row to stand out
                                const isHeaderRow = cIdx === 0;
                                const cellStyle = isHeaderRow
                                    ? "font-bold text-indigo-300 bg-slate-900/40"
                                    : colorClass;

                                return (
                                    <td key={rIdx} className={`px-4 py-2 border-r border-slate-800/30 whitespace-nowrap transition-colors ${cellStyle}`}>
                                        {col.format ? col.format(val, row) : val}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Sections ---

const FinancialCharts = ({ data }) => {
    if (!data || !data.raw || !data.raw.quarterly) return null;

    const chartData = useMemo(() => {
        const quarters = data.raw.quarterly;
        const yoy = data.derived.yoy || [];
        const momentum = data.derived.momentum || [];
        const efficiency = data.derived.efficiency || [];
        const structureHistorical = data.derived.structure?.historical || [];

        return [...quarters].reverse().map((item, idx) => {
            const revIdx = quarters.length - 1 - idx;
            const structItem = structureHistorical.find(s => s.date === item.date) || {};
            const yoyItem = yoy[revIdx] || {};
            const momentumItem = momentum[revIdx] || {};
            const efficiencyItem = efficiency[revIdx] || {};

            return {
                ...item,
                ...yoyItem,
                ...momentumItem,
                ...efficiencyItem,
                ...structItem,
                periodLabel: `${item.period} ${item.calendarYear}`,
                // Logic for Gap
                growthGap: (yoyItem.eps_yoy_pct || 0) - (yoyItem.sales_yoy_pct || 0),
                // YoY Change for ROCE/Other Income (manual diff since derived might not have it per row)
                epsQoQ: idx > 0 ? ((item.eps - [...quarters].reverse()[idx - 1].eps) / ([...quarters].reverse()[idx - 1].eps || 1)) * 100 : 0,
                revenueQoQ: idx > 0 ? ((item.revenue - [...quarters].reverse()[idx - 1].revenue) / ([...quarters].reverse()[idx - 1].revenue || 1)) * 100 : 0
            };
        });
    }, [data]);

    const latest = chartData[chartData.length - 1] || {};

    // 1. EPS Trend & Structure
    const epsInterpretation = useMemo(() => {
        const isBreakout = latest.eps > latest.eps_prior_high;
        return {
            text: isBreakout
                ? "EPS Breakout: Current earnings at an all-time high (Above Prior Peak)."
                : "EPS Consolidation: Current earnings are below the prior structural peak.",
            color: isBreakout ? "text-emerald-400" : "text-amber-400"
        };
    }, [latest]);

    const epsTableCols = [
        { key: 'periodLabel', label: 'Quarter' },
        { key: 'eps', label: 'EPS (₹)', format: (v) => `₹${(v ?? 0).toFixed(2)}` },
        { key: 'epsQoQ', label: 'QoQ %', format: (v) => `${(v ?? 0) > 0 ? '+' : ''}${(v ?? 0).toFixed(1)}%`, getColor: (v) => v > 0 ? 'text-emerald-400' : 'text-red-400' },
        { key: 'eps_yoy_pct', label: 'YoY %', format: (v) => `${(v ?? 0) > 0 ? '+' : ''}${(v ?? 0).toFixed(1)}%`, getColor: (v) => v > 15 ? 'text-emerald-400 font-bold' : (v < 0 ? 'text-red-400' : 'text-slate-400') }
    ];

    // 2. EPS vs Sales
    const epsVsSalesInterpretation = (() => {
        const eps = latest.eps_yoy_pct || 0;
        const sales = latest.sales_yoy_pct || 0;
        if (eps >= sales && eps > 0) return { text: "Quality Growth: Earnings outpace revenue.", color: "text-emerald-400" };
        if (eps < sales && eps > 0) return { text: "Margin Pressure: Revenue outpaces earnings progress.", color: "text-amber-400" };
        if (eps < 0 && sales > 0) return { text: "Critical Divergence: Revenue rising while profits fall.", color: "text-red-400" };
        return { text: "Growth Alignment analysis.", color: "text-slate-500" };
    })();

    const qualityTableCols = [
        { key: 'periodLabel', label: 'Quarter' },
        { key: 'sales_yoy_pct', label: 'Sales YoY%', format: (v) => `${(v ?? 0).toFixed(1)}%` },
        { key: 'eps_yoy_pct', label: 'EPS YoY%', format: (v) => `${(v ?? 0).toFixed(1)}%` },
        {
            key: 'growthGap',
            label: 'Gap',
            format: (v) => `${(v ?? 0) > 0 ? '+' : ''}${(v ?? 0).toFixed(1)}`,
            getColor: (v) => v > 0 ? 'text-emerald-400 bg-emerald-500/10 px-1 rounded' : 'text-red-400 bg-red-500/10 px-1 rounded'
        }
    ];

    // 3. 2Q Rolling Momentum
    const momentumTableCols = [
        { key: 'periodLabel', label: 'Quarter' },
        { key: 'eps_rolling_2q_growth', label: 'EPS 2Q Avg%', format: (v) => `${(v ?? 0).toFixed(1)}%` },
        { key: 'sales_rolling_2q_growth', label: 'Sales 2Q Avg%', format: (v) => `${(v ?? 0).toFixed(1)}%` }
    ];

    // 4. Net Margin
    const marginTableCols = [
        { key: 'periodLabel', label: 'Quarter' },
        { key: 'net_margin_pct', label: 'Margin %', format: (v) => `${(v ?? 0).toFixed(1)}%` },
        { key: 'net_margin_yoy_delta', label: 'Margin Δ', format: (v) => `${(v ?? 0) > 0 ? '+' : ''}${(v ?? 0).toFixed(2)}`, getColor: (v) => v > 0 ? 'text-emerald-400' : 'text-red-400' }
    ];

    // 5. Other Income
    const otherIncomeTableCols = [
        { key: 'periodLabel', label: 'Quarter' },
        { key: 'other_income_ratio', label: 'OI % of Net', format: (v) => `${((v ?? 0) * 100).toFixed(1)}%`, getColor: (v) => v > 0.25 ? 'text-red-400 font-bold' : (v > 0.1 ? 'text-amber-400' : 'text-slate-400') }
    ];

    // 6. ROCE
    const roceTableCols = [
        { key: 'periodLabel', label: 'Quarter' },
        { key: 'roce', label: 'ROCE %', format: (v) => `${(v ?? 0).toFixed(1)}%`, getColor: (v) => v > 15 ? 'text-emerald-400 font-bold' : (v < 10 ? 'text-red-400' : 'text-slate-400') }
    ];

    const reversedData = useMemo(() => [...chartData].reverse(), [chartData]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* 1. EPS Trend */}
            <SectionCard
                title="1. EPS Trend & Structure"
                icon={<BarChart3 size={18} />}
                interpretation={epsInterpretation}
                dataForTable={reversedData}
                chart={
                    <ResponsiveContainer>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="periodLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip suffix=" (₹)" />} />
                            {latest.eps_prior_high && (
                                <ReferenceLine y={latest.eps_prior_high} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ position: 'right', value: 'Prior Peak', fill: '#ef4444', fontSize: 8 }} />
                            )}
                            <Bar dataKey="eps" name="Quarterly EPS" fill="#10b981" opacity={0.3} radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="eps" name="EPS Line" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="eps_rolling_4q" name="4Q Smoothed" stroke="#6366f1" strokeWidth={3} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                }
                table={<MiniTable columns={epsTableCols} data={null} highlightCol="eps" />}
            />

            {/* 2. EPS vs Sales */}
            <SectionCard
                title="2. Quality Confirmation (YoY)"
                icon={<LayoutGrid size={18} />}
                interpretation={epsVsSalesInterpretation}
                dataForTable={reversedData}
                chart={
                    <ResponsiveContainer>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="periodLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" dataKey="sales_yoy_pct" name="Sales YoY %" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="eps_yoy_pct" name="EPS YoY %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                }
                table={<MiniTable columns={qualityTableCols} data={null} highlightCol="growthGap" />}
            />

            {/* 3. Momentum */}
            <SectionCard
                title="3. 2Q Rolling Momentum"
                icon={<BarChart3 size={18} />}
                interpretation={{ text: "Smoothing removes quarterly noise to reveal trend.", color: "text-slate-400" }}
                dataForTable={reversedData}
                chart={
                    <ResponsiveContainer>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="periodLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="eps_rolling_2q_growth" name="2Q EPS Growth" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
                            <Line type="monotone" dataKey="sales_rolling_2q_growth" name="2Q Sales Growth" stroke="#3b82f6" strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                }
                table={<MiniTable columns={momentumTableCols} data={null} />}
            />

            {/* 4. Profitability */}
            <SectionCard
                title="4. Net Margin Profile"
                icon={<LayoutGrid size={18} />}
                interpretation={{ text: "Bar: Absolute Margin % | Line: YoY Delta (Basis Points)", color: "text-slate-400" }}
                dataForTable={reversedData}
                chart={
                    <ResponsiveContainer>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="periodLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar yAxisId="left" dataKey="net_margin_pct" name="Margin %" fill="#4f46e5" opacity={0.6} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="stepAfter" dataKey="net_margin_yoy_delta" name="Margin Δ" stroke="#f59e0b" strokeWidth={3} />
                        </ComposedChart>
                    </ResponsiveContainer>
                }
                table={<MiniTable columns={marginTableCols} data={null} />}
            />

            {/* 5. Other Income */}
            <SectionCard
                title="5. Earnings Quality (OI Check)"
                icon={<Info size={18} />}
                dataForTable={reversedData}
                interpretation={{
                    text: "Health: ✅ <15% Healthy | ⚠️ 15-30% Watch | ❌ >30% Quality Risk",
                    color: latest.other_income_ratio > 0.3 ? "text-red-400" : (latest.other_income_ratio > 0.15 ? "text-amber-400" : "text-emerald-400")
                }}
                chart={
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="periodLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip suffix="%" />} />
                            <Line type="monotone" dataKey="other_income_3y_avg" name="3Y Average" stroke="#94a3b8" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                            <Bar dataKey="other_income_ratio" name="OI Ratio">
                                {chartData.map((entry, index) => {
                                    const isHigh = entry.other_income_ratio > 0.3;
                                    const isRising = index > 0 && entry.other_income_ratio > chartData[index - 1].other_income_ratio;
                                    return <Cell key={`cell-${index}`} fill={isHigh && isRising ? '#ef4444' : entry.other_income_ratio > 0.15 ? '#f59e0b' : '#10b981'} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                }
                table={<MiniTable columns={otherIncomeTableCols} data={null} />}
            />

            {/* 6. ROCE */}
            <SectionCard
                title="6. Capital Efficiency (ROCE)"
                icon={<BarChart3 size={18} />}
                interpretation={{ text: "Dotted: Cost of Capital (14%) | Trend: ROE performance.", color: "text-slate-400" }}
                dataForTable={reversedData}
                chart={
                    <ResponsiveContainer>
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="periodLabel" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={14} stroke="#64748b" strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="roce" name="ROCE %" stroke="#ec4899" strokeWidth={4} dot={{ r: 4, fill: '#ec4899', stroke: '#fff' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                }
                table={<MiniTable columns={roceTableCols} data={null} />}
            />
        </div>
    );
};

export default FinancialCharts;
