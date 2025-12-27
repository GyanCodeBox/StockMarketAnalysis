import React from 'react';
import { AlertCircle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

const MarketStructureBanner = ({ structure }) => {
    if (!structure) return null;

    const { bias, confidence, explanation } = structure;

    // Visual Language Guidelines
    const getStyles = (bias) => {
        switch (bias) {
            case 'ACCUMULATION':
                return {
                    wrapper: 'from-teal-900/30 to-slate-900/50 border-teal-500/30',
                    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
                    icon: ShieldCheck,
                    iconColor: 'text-teal-400',
                    titleColor: 'text-teal-200'
                };
            case 'FAILED_BREAKOUT':
                return {
                    wrapper: 'from-amber-900/30 to-slate-900/50 border-amber-500/30',
                    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    icon: AlertCircle,
                    iconColor: 'text-amber-400',
                    titleColor: 'text-amber-200'
                };
            case 'NEUTRAL':
            default:
                return {
                    wrapper: 'from-slate-800/40 to-slate-900/50 border-slate-700/50',
                    badge: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
                    icon: HelpCircle,
                    iconColor: 'text-slate-400',
                    titleColor: 'text-slate-300'
                };
        }
    };

    const styles = getStyles(bias);
    const Icon = styles.icon;

    return (
        <div className={`
      relative overflow-hidden rounded-xl border backdrop-blur-sm
      bg-gradient-to-r ${styles.wrapper}
      transition-all duration-500 ease-out
      animate-fade-in mb-6
    `}>
            {/* Decorative background blur */}
            <div className={`absolute top-0 right-0 w-64 h-full bg-gradient-to-l ${styles.wrapper} opacity-20`} />

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 md:p-5 relative z-10">

                {/* Left: State & Confidence */}
                <div className="flex-shrink-0 flex items-center gap-4">
                    <div className="p-3 bg-slate-950/30 rounded-lg shadow-inner">
                        <Icon className={`w-8 h-8 ${styles.iconColor} opacity-80`} />
                    </div>

                    <div className="flex flex-col">
                        <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-0.5">
                            Market Structure
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
                        {/* Subtle Temporal Context */}
                        {structure.details?.zone?.end_time && (
                            <span className="text-[10px] text-slate-500 font-medium ml-1">
                                • Updated {new Date(structure.details.zone.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        {structure.details?.event?.failure_time && (
                            <span className="text-[10px] text-slate-500 font-medium ml-1">
                                • Updated {new Date(structure.details.event.failure_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {explanation}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketStructureBanner;
