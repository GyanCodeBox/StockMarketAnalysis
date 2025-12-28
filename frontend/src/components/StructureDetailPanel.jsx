import React from 'react';
import { ShieldCheck, AlertCircle, X, Search, Eye, AlertTriangle } from 'lucide-react';

const StructureDetailPanel = ({ type, data, onClose }) => {
    if (!data) return null;

    const isDistribution = type === 'DISTRIBUTION';

    // Theme selection
    const theme = isDistribution ? {
        border: 'border-rose-500/30',
        bg: 'bg-rose-950/20',
        accent: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        dot: 'bg-rose-500',
        icon: AlertCircle,
        title: 'Distribution'
    } : {
        border: 'border-teal-500/30',
        bg: 'bg-teal-950/20',
        accent: 'text-teal-400',
        badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        dot: 'bg-teal-500',
        icon: ShieldCheck,
        title: 'Accumulation'
    };

    const Icon = theme.icon;

    return (
        <div className={`mb-6 p-5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${theme.border} ${theme.bg}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-950/50 ${theme.border} border`}>
                        <Icon className={`w-5 h-5 ${theme.accent}`} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            Structure Context
                        </div>
                        <div className={`text-lg font-black tracking-tight ${theme.accent}`}>
                            {theme.title}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-2.5 py-1 text-[10px] font-bold rounded border ${theme.badge} tracking-wide`}>
                        CONFIDENCE: {data.confidence.toUpperCase()}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                        title="Clear detail view"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Intro Line */}
            <div className="mb-5">
                <p className="text-slate-200 font-semibold leading-relaxed border-l-2 pl-4 border-slate-700/50">
                    {data.summary}
                </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Characteristics & Interpretation */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Search className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Characteristics</span>
                        </div>
                        <ul className="space-y-2">
                            {data.characteristics?.map((c, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-center gap-2.5">
                                    <div className={`w-1 h-1 rounded-full ${theme.dot} opacity-60`} />
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Interpretation</div>
                        <p className="text-sm text-slate-400 leading-relaxed italic">
                            {data.interpretation}
                        </p>
                    </div>
                </div>

                {/* Right Column: What to Watch & Failure Signals */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What to Watch</span>
                        </div>
                        <ul className="space-y-2.5">
                            {data.what_to_watch?.map((w, idx) => (
                                <li key={idx} className="text-sm text-slate-200 font-medium bg-slate-900/40 p-2 rounded border border-slate-800/50">
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-rose-400/70">Failure Signals</span>
                        </div>
                        <ul className="space-y-2">
                            {data.failure_signals?.map((f, idx) => (
                                <li key={idx} className="text-[13px] text-slate-400 flex items-start gap-2">
                                    <span className="text-rose-500/50 mt-1">•</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StructureDetailPanel;
