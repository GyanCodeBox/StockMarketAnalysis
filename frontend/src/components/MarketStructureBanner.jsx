import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, HelpCircle, Info } from 'lucide-react';

const MarketStructureBanner = ({ structure, onSelectStructure }) => {
    const [isHovered, setIsHovered] = useState(false);
    if (!structure) return null;

    const { bias, confidence, explanation, details } = structure;
    const metrics = details?.metrics || details?.zone?.metrics || details?.event?.metrics || {};

    const handleClick = () => {
        if (onSelectStructure && (bias === 'ACCUMULATION' || bias === 'DISTRIBUTION') && details?.zone) {
            onSelectStructure(details.zone);
        }
    };

    // Visual Language Guidelines
    const getStyles = (bias) => {
        switch (bias) {
            case 'ACCUMULATION':
                return {
                    wrapper: 'from-teal-900/30 to-slate-900/50 border-teal-500/30',
                    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                    icon: ShieldCheck,
                    iconColor: 'text-teal-400',
                    titleColor: 'text-teal-200',
                    dotColor: 'bg-teal-500',
                    headerColor: 'text-teal-300',
                    borderColor: 'border-teal-500/20'
                };
            case 'DISTRIBUTION':
                return {
                    wrapper: 'from-rose-900/30 to-slate-900/50 border-rose-500/30',
                    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                    icon: AlertCircle,
                    iconColor: 'text-rose-400',
                    titleColor: 'text-rose-200',
                    dotColor: 'bg-rose-500',
                    headerColor: 'text-rose-300',
                    borderColor: 'border-rose-500/20'
                };
            case 'FAILED_BREAKOUT':
                return {
                    wrapper: 'from-amber-900/30 to-slate-900/50 border-amber-500/30',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    icon: AlertCircle,
                    iconColor: 'text-amber-400',
                    titleColor: 'text-amber-200',
                    dotColor: 'bg-amber-500',
                    headerColor: 'text-amber-300',
                    borderColor: 'border-amber-500/20'
                };
            case 'NEUTRAL':
            default:
                return {
                    wrapper: 'from-slate-800/40 to-slate-900/50 border-slate-700/50',
                    badge: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
                    icon: HelpCircle,
                    iconColor: 'text-slate-400',
                    titleColor: 'text-slate-300',
                    dotColor: 'bg-slate-500',
                    headerColor: 'text-slate-300',
                    borderColor: 'border-slate-700/50'
                };
        }
    };

    const styles = getStyles(bias);
    const Icon = styles.icon;

    const renderEvidence = () => {
        const rowStyle = "text-[11px] flex items-center gap-2";
        const labelStyle = "text-slate-400";
        const valStyle = "text-slate-100 font-bold";

        switch (bias) {
            case 'ACCUMULATION':
                return (
                    <div className="max-w-sm mx-auto">
                        <div className={`text-xs font-semibold ${styles.headerColor} mb-3 tracking-tight border-b ${styles.borderColor} pb-1.5 font-medium`}>
                            Accumulation Zone · {confidence} Confidence
                        </div>
                        <ul className="space-y-2 mb-4">
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Range compressed ~</span>
                                <span className={valStyle}>{(metrics.compression_pct * 100).toFixed(1)}%</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Duration:</span>
                                <span className={valStyle}>{metrics.duration} sessions</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Volume stable:</span>
                                <span className={valStyle}>{metrics.volume_ratio}× prior average</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={valStyle}>{metrics.absorption_candles || 0}</span>
                                <span className={labelStyle}>lower-wick absorption signals</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Breakout attempt:</span>
                                <span className={valStyle}>None detected</span>
                            </li>
                        </ul>
                        <div className="text-[10px] italic text-slate-500 pt-1">
                            Structure favors patience, not urgency
                        </div>
                    </div>
                );
            case 'DISTRIBUTION':
                return (
                    <div className="max-w-sm mx-auto">
                        <div className={`text-xs font-semibold ${styles.headerColor} mb-3 tracking-tight border-b ${styles.borderColor} pb-1.5 font-medium`}>
                            Distribution Zone · {confidence} Confidence
                        </div>
                        <ul className="space-y-2 mb-4">
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Range compressed ~</span>
                                <span className={valStyle}>{(metrics.compression_pct * 100).toFixed(1)}%</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Duration:</span>
                                <span className={valStyle}>{metrics.duration} sessions</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Volume churn:</span>
                                <span className={valStyle}>{metrics.volume_ratio}× prior average</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={valStyle}>{metrics.upper_wick_count || 0}</span>
                                <span className={labelStyle}>upper-wick supply rejections</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Upside acceptance:</span>
                                <span className={valStyle}>None detected</span>
                            </li>
                        </ul>
                        <div className="text-[10px] italic text-slate-500 pt-1">
                            Supply dominance after advance
                        </div>
                    </div>
                );
            case 'FAILED_BREAKOUT':
                return (
                    <div className="max-w-sm mx-auto">
                        <div className={`text-xs font-semibold ${styles.headerColor} mb-3 tracking-tight border-b ${styles.borderColor} pb-1.5 font-medium`}>
                            Failed Breakout · {confidence} Confidence
                        </div>
                        <ul className="space-y-2 mb-4">
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Breakout above:</span>
                                <span className={valStyle}>₹{metrics.breakout_level}</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Volume on breakout:</span>
                                <span className={valStyle}>{metrics.volume_ratio}× average</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Re-entry logic:</span>
                                <span className={valStyle}>{metrics.failure_window} candle(s)</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Signal type:</span>
                                <span className={valStyle}>{details.event?.failure_type || 'Rejection'} observed</span>
                            </li>
                        </ul>
                        <div className="text-[10px] italic text-slate-500 pt-1">
                            Trap behavior detected
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="max-w-sm mx-auto">
                        <div className={`text-xs font-semibold ${styles.headerColor} mb-3 tracking-tight border-b ${styles.borderColor} pb-1.5 font-medium`}>
                            Neutral Consolidation
                        </div>
                        <ul className="space-y-2 mb-4">
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Primary state:</span>
                                <span className={valStyle}>{metrics.duration < 8 ? 'Duration insufficient' : 'Normal bounds'}</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Volume ratio:</span>
                                <span className={valStyle}>{metrics.volume_ratio}× prior</span>
                            </li>
                            <li className={rowStyle}>
                                <span className={`w-1 h-1 rounded-full ${styles.dotColor}`} />
                                <span className={labelStyle}>Absence of edge signals</span>
                            </li>
                        </ul>
                        <div className="text-[10px] italic text-slate-500 pt-1">
                            No structural edge detected
                        </div>
                    </div>
                );
        }
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl border backdrop-blur-sm
                bg-gradient-to-r ${styles.wrapper}
                transition-all duration-500 ease-out
                animate-fade-in mb-6 cursor-pointer
                min-h-[110px]
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {/* Decorative background blur */}
            <div className={`absolute top-0 right-0 w-64 h-full bg-gradient-to-l ${styles.wrapper} opacity-20`} />

            <div className="relative z-10 w-full h-full">
                {!isHovered ? (
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 md:p-5 h-full animate-in fade-in duration-300">
                        {/* Left: State & Confidence */}
                        <div className="flex-shrink-0 flex items-center gap-4">
                            <div className="p-3 bg-slate-950/30 rounded-lg shadow-inner">
                                <Icon className={`w-8 h-8 ${styles.iconColor} opacity-80`} />
                            </div>

                            <div className="flex flex-col">
                                <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-0.5 flex items-center gap-1.5">
                                    Market Structure
                                    <Info className="w-3 h-3 text-slate-600" />
                                </div>
                                <div className={`text-xl font-black tracking-tight ${styles.titleColor}`}>
                                    {bias.replace('_', ' ')}
                                </div>
                            </div>
                        </div>

                        {/* Separator (Desktop) */}
                        <div className="hidden md:block w-px h-10 bg-slate-700/40 mx-2" />

                        {/* Middle: Explanation */}
                        <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wide rounded border ${styles.badge}`}>
                                    Confidence: {confidence}
                                </span>
                                {structure.transition && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold tracking-tight rounded bg-slate-800/80 text-slate-400 border border-slate-700/50 uppercase">
                                        Shift: {structure.transition.to.replace('_', ' ')}
                                    </span>
                                )}
                                {(details?.zone?.end_time || details?.event?.failure_time) && (
                                    <span className="text-[10px] text-slate-500 font-medium ml-1">
                                        • Updated {new Date(details?.zone?.end_time || details?.event?.failure_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                {explanation}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 md:p-5 w-full h-full animate-in fade-in zoom-in duration-200 overflow-y-auto scrollbar-hide">
                        {renderEvidence()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketStructureBanner;
