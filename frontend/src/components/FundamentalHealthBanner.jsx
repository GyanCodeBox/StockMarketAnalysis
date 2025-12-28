import React from 'react';
import { ShieldCheck, AlertTriangle, TrendingUp, BarChart3, Target, Zap, Activity } from 'lucide-react';

const FundamentalHealthBanner = ({ scoreData }) => {
    if (!scoreData) return null;

    const { value, grade, summaries, warnings, phase, diagnostic } = scoreData;

    const getGradeStyles = (grade) => {
        switch (grade.toUpperCase()) {
            case 'STRONG':
                return {
                    bg: 'bg-emerald-950/40',
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-400',
                    icon: <ShieldCheck className="text-emerald-400" size={24} />,
                    accent: 'from-emerald-600 to-teal-600'
                };
            case 'NEUTRAL':
                return {
                    bg: 'bg-amber-950/40',
                    border: 'border-amber-500/30',
                    text: 'text-amber-400',
                    icon: <Activity className="text-amber-400" size={24} />,
                    accent: 'from-amber-600 to-orange-600'
                };
            default:
                return {
                    bg: 'bg-red-950/40',
                    border: 'border-red-500/30',
                    text: 'text-red-400',
                    icon: <AlertTriangle className="text-red-400" size={24} />,
                    accent: 'from-red-600 to-rose-600'
                };
        }
    };

    const getPhaseColor = (p) => {
        switch (p) {
            case 'Growth': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'Compression': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'Deterioration': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
        }
    };

    const styles = getGradeStyles(grade);

    return (
        <div className={`relative overflow-hidden p-6 rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-md shadow-2xl transition-all`}>
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br ${styles.accent} opacity-10 blur-3xl rounded-full`}></div>

            <div className="flex flex-col xl:flex-row gap-8 items-start relative z-10">
                {/* Score & Phase Badge (Left Column) */}
                <div className="flex flex-col items-center gap-4 flex-shrink-0 w-full xl:w-auto">
                    <div className="relative">
                        <svg className="w-28 h-28 transform -rotate-90">
                            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-800" />
                            <circle
                                cx="56"
                                cy="56"
                                r="50"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={314.15}
                                strokeDashoffset={314.15 * (1 - value / 100)}
                                className={`${styles.text} transition-all duration-1000 ease-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white">{value}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Global Score</span>
                        </div>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${getPhaseColor(phase)}`}>
                        {phase || 'Maturity'} Phase
                    </span>
                </div>

                {/* Analyst Signals (Center Column) */}
                <div className="flex-grow space-y-6 w-full">
                    <div className="flex items-center gap-3">
                        {styles.icon}
                        <h3 className={`text-xl font-black uppercase tracking-tight ${styles.text}`}>
                            {grade} Regime Diagnostic
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <SignalItem
                            label="Growth"
                            desc={summaries?.growth}
                            icon={<TrendingUp size={14} className="text-indigo-400" />}
                        />
                        <SignalItem
                            label="Structure"
                            desc={summaries?.structure}
                            icon={<Zap size={14} className="text-indigo-400" />}
                        />
                        <SignalItem
                            label="Quality"
                            desc={summaries?.quality}
                            icon={<ShieldCheck size={14} className="text-indigo-400" />}
                        />
                        <SignalItem
                            label="Profitability"
                            desc={summaries?.profitability}
                            icon={<BarChart3 size={14} className="text-indigo-400" />}
                        />
                        <SignalItem
                            label="Efficiency"
                            desc={summaries?.efficiency}
                            icon={<Target size={14} className="text-indigo-400" />}
                        />

                        <div className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-xl border border-white/5 md:col-span-2">
                            <div className="mt-1 bg-indigo-500/20 p-2 rounded-lg">
                                <Activity size={16} className="text-indigo-400" />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Executive Summary</span>
                                <p className="text-slate-200 text-xs font-medium leading-relaxed italic">
                                    "{diagnostic || "Strategic outlook based on recent performance data."}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Constraints (Right Column) */}
                {warnings && warnings.length > 0 && (
                    <div className="w-full xl:w-64 space-y-3 bg-red-950/10 p-5 rounded-2xl border border-red-500/10">
                        <h4 className="text-[9px] font-black text-red-400/60 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle size={12} />
                            Risk Constraints
                        </h4>
                        <div className="space-y-2">
                            {warnings.map((warn, idx) => (
                                <div key={idx} className="bg-slate-950/40 p-2.5 rounded border border-red-500/10 text-[10px] font-bold text-red-200/80 leading-normal">
                                    {warn}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SignalItem = ({ label, desc, icon }) => {
    // Basic sentiment coloring for descriptions
    const getDescColor = (text) => {
        if (!text) return 'text-slate-400';
        const t = text.toLowerCase();
        if (t.includes('deteriorating') || t.includes('weak') || t.includes('below cost')) return 'text-red-400';
        if (t.includes('expanding') || t.includes('breakout') || t.includes('healthy') || t.includes('above cost')) return 'text-emerald-400';
        if (t.includes('pressure') || t.includes('moderate') || t.includes('watch')) return 'text-amber-400';
        return 'text-slate-300';
    };

    return (
        <div className="flex items-start gap-4 py-1 group border-b border-white/5 pb-2">
            <div className="mt-1 bg-slate-950 p-1.5 rounded-md border border-slate-800 transition-colors group-hover:border-indigo-500/30">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</span>
                <span className={`text-[11px] font-bold tracking-tight ${getDescColor(desc)}`}>
                    {desc || 'Awaiting metrics...'}
                </span>
            </div>
        </div>
    );
};

export default FundamentalHealthBanner;
