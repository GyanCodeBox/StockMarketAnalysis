import React, { useState } from 'react';
import { ArrowUpDown, AlertTriangle, CheckCircle2, AlertOctagon, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ATTENTION_COLORS = {
    'CRITICAL': 'text-red-400 bg-red-500/10 border-red-500/20',
    'REVIEW': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'MONITOR': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'STABLE': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
};

const RISK_COLORS = {
    'HIGH': 'text-red-400 font-bold',
    'MEDIUM': 'text-amber-400 font-medium',
    'LOW': 'text-slate-400'
};

const DISPLAY_MAPPINGS = {
    'Early Opportunity': 'Emerging Alignment',
    'Monitor': 'Ongoing Review',
    'MONITOR': 'ONGOING REVIEW',
    'Stable': 'No Immediate Risk',
    'STABLE': 'NO IMM. RISK', // Condensed for badge
    'High Risk': 'Elevated Risk',
    'HIGH': 'ELEVATED', // Risk Level
    'LOW': 'MINIMAL',
    'Start Analysis': 'Run Portfolio Scan'
};

const formatDisplay = (val) => DISPLAY_MAPPINGS[val] || val;

const PortfolioTable = ({ stocks }) => {
    const navigate = useNavigate();
    const [sortConfig, setSortConfig] = useState({ key: 'attention_flag', direction: 'asc' });

    const handleRowClick = (symbol) => {
        navigate(`/analyze/${symbol}`);
    };

    if (!stocks || stocks.length === 0) return null;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Scrollable Container */}
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/90 text-slate-400 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                Symbol
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                Confluence State
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right cursor-pointer hover:text-white transition-colors group">
                                <div className="flex items-center justify-end gap-1">
                                    Composite Score
                                    <div className="relative group/tooltip">
                                        <Info className="w-3 h-3 text-slate-500 hover:text-indigo-400" />
                                        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded shadow-xl hidden group-hover/tooltip:block z-50 normal-case font-normal leading-relaxed">
                                            Composite score reflects relative regime quality across the analyzed universe. Not a return expectation.
                                        </div>
                                    </div>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors">
                                Risk Level
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                Key Constraint
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                                Stability
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors">
                                Attention
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {stocks.map((stock) => (
                            <tr
                                key={stock.symbol}
                                onClick={() => handleRowClick(stock.symbol)}
                                className="group hover:bg-indigo-500/5 transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-indigo-500"
                            >
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{stock.symbol}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-slate-300">{formatDisplay(stock.confluence_state)}</span>
                                    {stock.details?.confluence_fmt && (
                                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium lowercase">
                                            {stock.details.confluence_fmt.toLowerCase().replace(' + ', ' · ')}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-300">
                                    {stock.composite_score.toFixed(0)}
                                </td>
                                <td className={`px-6 py-4 text-center text-xs ${RISK_COLORS[stock.risk_level] || 'text-slate-400'}`}>
                                    {formatDisplay(stock.risk_level)}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400 max-w-[200px] truncate" title={stock.key_constraint}>
                                    {stock.key_constraint || <span className="text-slate-600 italic">None</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div
                                        className="flex items-center gap-2"
                                        title={stock.stability_status === 'Stable' ? "Stable: Regime persistence above historical median" : "Unstable: Recent regime transitions (high change frequency)"}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${stock.stability_status === 'Stable' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                        <span className="text-xs text-slate-300">{stock.stability_status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${ATTENTION_COLORS[stock.attention_flag] || 'text-slate-400 border-slate-800'}`}>
                                        {formatDisplay(stock.attention_flag)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Meta */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                <span>Showing {stocks.length} instruments</span>
                <span className="italic">Portfolio View is a monitoring and prioritization layer. It does not generate signals or recommendations.</span>
            </div>
        </div>
    );
};

export default PortfolioTable;
