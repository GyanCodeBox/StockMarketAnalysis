import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';

const ConfluenceBanner = ({ confluenceData }) => {
    if (!confluenceData) return null;

    const { state, confidence, explanation, institutional_note, risk_level, technical_regime, fundamental_regime, subtitle } = confluenceData;

    // Map confidence to Signal Strength
    const getSignalStrength = () => {
        switch (confidence) {
            case 'HIGH': return 'STRONG';
            case 'MEDIUM': return 'MODERATE';
            default: return 'WEAK';
        }
    };

    // Styling based on signal strength
    const getSignalStyles = () => {
        const strength = getSignalStrength();
        switch (strength) {
            case 'STRONG':
                return {
                    bg: 'bg-emerald-950/40',
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-400',
                    icon: <CheckCircle2 className="text-emerald-400" size={20} />,
                    accent: 'from-emerald-600 to-teal-600'
                };
            case 'MODERATE':
                return {
                    bg: 'bg-amber-950/40',
                    border: 'border-amber-500/30',
                    text: 'text-amber-400',
                    icon: <MinusCircle className="text-amber-400" size={20} />,
                    accent: 'from-amber-600 to-orange-600'
                };
            default: // WEAK
                return {
                    bg: 'bg-slate-950/40',
                    border: 'border-slate-500/30',
                    text: 'text-slate-400',
                    icon: <AlertCircle className="text-slate-400" size={20} />,
                    accent: 'from-slate-600 to-slate-700'
                };
        }
    };

    const getRiskBadgeColor = () => {
        switch (risk_level) {
            case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const styles = getSignalStyles();
    const signalStrength = getSignalStrength();

    return (
        <div className={`relative overflow-hidden p-6 rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-md shadow-2xl`}>
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-40 h-40 bg-gradient-to-br ${styles.accent} opacity-10 blur-3xl rounded-full`}></div>

            <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-950/50 rounded-lg border border-white/10 mt-1">
                            {styles.icon}
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black uppercase tracking-tight ${styles.text}`}>
                                {state}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed max-w-md">
                                    {subtitle}
                                </p>
                            )}
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                Institutional Confluence Alignment
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start md:items-end">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskBadgeColor()}`}>
                            Risk Severity: {risk_level}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles.border} ${styles.text}`}>
                            Alignment Depth: {signalStrength}
                        </span>
                    </div>
                </div>

                {/* Explanation */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    <p className="text-slate-200 text-sm font-medium leading-relaxed">
                        <span className="text-indigo-400 mr-2">✦</span>
                        {explanation}
                    </p>
                </div>

                {/* Regime Alignment Visual */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Technical Regime */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={14} className="text-indigo-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Technical</span>
                        </div>
                        <p className="text-lg font-black text-white">{technical_regime}</p>
                    </div>

                    {/* Confluence Indicator */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <svg width="80" height="40" viewBox="0 0 80 40">
                                <path
                                    d="M 10 20 L 30 20 M 50 20 L 70 20"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={styles.text}
                                    strokeDasharray="4 4"
                                />
                                <circle cx="40" cy="20" r="8" fill="currentColor" className={styles.text} opacity="0.3" />
                                <circle cx="40" cy="20" r="4" fill="currentColor" className={styles.text} />
                            </svg>
                            <p className="text-center text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                                Alignment
                            </p>
                        </div>
                    </div>

                    {/* Fundamental Regime */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={14} className="text-emerald-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fundamental</span>
                        </div>
                        <p className="text-lg font-black text-white">{fundamental_regime}</p>
                    </div>
                </div>

                {/* Institutional Note */}
                {institutional_note && (
                    <div className="border-t border-slate-800/50 pt-4">
                        <p className="text-xs text-slate-400 italic leading-relaxed">
                            <span className="text-slate-500 font-bold not-italic">Institutional Context:</span> {institutional_note}
                        </p>
                    </div>
                )}

                {/* Cognitive Safety Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 italic max-w-2xl leading-relaxed">
                        Confluence evaluates the alignment between technical structure and fundamental reality.
                        Alignment is an indicator of regime quality, not a directional prediction.
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/50 rounded-lg border border-white/5">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Decision Support Logic</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfluenceBanner;
