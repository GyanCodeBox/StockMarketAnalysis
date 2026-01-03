import React from 'react';
import { Gauge, TrendingUp, Activity, Zap } from 'lucide-react';

const CompositeScoreIndicator = ({ compositeData }) => {
    if (!compositeData) return null;

    const { value, band, attribution, breakdown } = compositeData;

    // Band styling
    const getBandStyles = () => {
        switch (band) {
            case 'STRONG':
                return {
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-500/20',
                    border: 'border-emerald-500/30',
                    fill: '#10b981'
                };
            case 'NEUTRAL':
                return {
                    color: 'text-amber-400',
                    bg: 'bg-amber-500/20',
                    border: 'border-amber-500/30',
                    fill: '#f59e0b'
                };
            default: // WEAK
                return {
                    color: 'text-red-400',
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/30',
                    fill: '#ef4444'
                };
        }
    };

    const styles = getBandStyles();
    const percentage = value;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-950/50 rounded-lg border border-white/10">
                            <Gauge size={18} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                Composite Regime Score
                            </h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Portfolio Ranking Signal
                            </p>
                        </div>
                    </div>
                </div>

                {/* Score Display */}
                <div className="flex items-center gap-6">
                    {/* Circular Gauge */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-32 h-32 transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-800"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke={styles.fill}
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={351.86}
                                strokeDashoffset={351.86 * (1 - percentage / 100)}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-black ${styles.color}`}>{value}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">/ 100</span>
                        </div>
                    </div>

                    {/* Band & Description */}
                    <div className="flex-grow space-y-3">
                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest border ${styles.border} ${styles.bg} ${styles.color}`}>
                            {band} Band
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {band === 'STRONG' && 'High-conviction regime with sustained strength across multiple dimensions'}
                            {band === 'NEUTRAL' && 'Mixed signals or transitional state—monitor for regime clarity'}
                            {band === 'WEAK' && 'Deteriorating conditions across technical and fundamental factors'}
                        </p>
                    </div>
                </div>

                {/* Attribution Breakdown */}
                <div className="border-t border-slate-800/50 pt-4 space-y-3">
                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Score Attribution
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Technical */}
                        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={12} className="text-indigo-400" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Technical</span>
                            </div>
                            <p className="text-2xl font-black text-indigo-400">{breakdown?.technical_pct?.toFixed(0)}%</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1">
                                Score: {attribution?.technical || 0}
                            </p>
                        </div>

                        {/* Fundamental */}
                        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={12} className="text-emerald-400" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fundamental</span>
                            </div>
                            <p className="text-2xl font-black text-emerald-400">{breakdown?.fundamental_pct?.toFixed(0)}%</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1">
                                Score: {attribution?.fundamental || 0}
                            </p>
                        </div>

                        {/* Stability */}
                        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={12} className="text-amber-400" />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stability</span>
                            </div>
                            <p className="text-2xl font-black text-amber-400">{breakdown?.stability_pct?.toFixed(0)}%</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1">
                                Score: {attribution?.stability || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        <span className="text-indigo-400 font-bold">Note:</span> This is a portfolio-ranking and comparison tool, not a recommendation. Use for relative strength assessment across holdings.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompositeScoreIndicator;
