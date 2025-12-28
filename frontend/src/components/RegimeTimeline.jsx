import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, Clock, Info } from 'lucide-react';

const RegimeTimeline = ({ regimeHistory = [], timeframe = 'day', onSegmentClick }) => {
    const [activeFilter, setActiveFilter] = useState(null);
    const [hoveredBiasFilter, setHoveredBiasFilter] = useState(null);

    if (!regimeHistory || regimeHistory.length === 0) {
        return null;
    }

    // 1. Color Mapping (Locked from PRD)
    const getRegimeColor = (bias) => {
        switch (bias) {
            case 'ACCUMULATION':
                return 'bg-teal-500/80 hover:bg-teal-400';
            case 'DISTRIBUTION':
                return 'bg-rose-500/80 hover:bg-rose-400';
            case 'FAILED_BREAKOUT':
                return 'bg-amber-500/90 hover:bg-amber-400';
            case 'NEUTRAL':
                return 'bg-slate-600/50 hover:bg-slate-500';
            default:
                return 'bg-slate-700/30';
        }
    };

    const getRegimeLabel = (bias) => {
        if (bias === 'FAILED_BREAKOUT') return 'FAILED BO';
        if (bias === 'ACCUMULATION') return 'ACC';
        if (bias === 'DISTRIBUTION') return 'DIST';
        return 'NEUT';
    };

    // Helper to format duration in readable time
    const formatTimeDuration = (bars, tf) => {
        if (tf === 'day') {
            if (bars >= 20) return `~${Math.round(bars / 20 * 10) / 10} mo`;
            if (bars >= 5) return `~${Math.round(bars / 5 * 10) / 10} wk`;
            return `${bars}d`;
        }
        if (tf === 'week') {
            if (bars >= 4) return `~${Math.round(bars / 4 * 10) / 10} mo`;
            return `${bars}wk`;
        }
        return `${bars} bars`;
    };

    // 2. Relative Scaling Logic
    const processedSegments = useMemo(() => {
        const totalDuration = regimeHistory.reduce((sum, item) => sum + item.duration, 0);
        let currentOffset = 0;

        return regimeHistory.map((item, idx) => {
            const widthPct = (item.duration / totalDuration) * 100;
            const segment = {
                ...item,
                widthPct,
                offsetLeftPct: currentOffset,
                color: getRegimeColor(item.bias),
                label: getRegimeLabel(item.bias),
                isLatest: idx === regimeHistory.length - 1,
                timeLabel: formatTimeDuration(item.duration, timeframe)
            };
            currentOffset += widthPct;
            return segment;
        });
    }, [regimeHistory, timeframe]);

    // Calculate legend counts
    const counts = useMemo(() => {
        return regimeHistory.reduce((acc, curr) => {
            acc[curr.bias] = (acc[curr.bias] || 0) + 1;
            return acc;
        }, {});
    }, [regimeHistory]);

    // Temporal Anchors
    const startDate = useMemo(() => {
        if (!regimeHistory.length) return '';
        const date = new Date(regimeHistory[0].start_time);
        return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }, [regimeHistory]);

    const endDate = useMemo(() => {
        if (!regimeHistory.length) return '';
        const date = new Date(regimeHistory[regimeHistory.length - 1].end_time);
        return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }, [regimeHistory]);

    const toggleFilter = (bias) => {
        setActiveFilter(prev => prev === bias ? null : bias);
    };

    return (
        <div className="w-full mt-4 flex flex-col gap-2 p-4 bg-gray-900 border border-gray-800 rounded-lg shadow-lg relative">
            {/* Subtle background gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800/20 to-transparent pointer-events-none" />

            <div className="flex justify-between items-center mb-1 relative z-10">
                <h4 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
                    <Info size={12} className="text-blue-400" />
                    Market Structure History
                </h4>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-500 font-medium">
                        {startDate} — {endDate}
                    </span>
                </div>
            </div>

            {/* Timeline Wrapper with Anchors */}
            <div className="relative pt-1 flex flex-col gap-1">
                {/* Remove overflow-hidden to allow tooltips to show */}
                <div className="relative w-full h-10 bg-gray-800 rounded-md flex border border-gray-800/50 shadow-inner">
                    {processedSegments.map((segment, idx) => {
                        const isDimmed = (activeFilter || hoveredBiasFilter) &&
                            (activeFilter !== segment.bias && hoveredBiasFilter !== segment.bias);

                        const isFirst = idx === 0;
                        const isLast = idx === processedSegments.length - 1;

                        return (
                            <div
                                key={`${segment.start_time}-${idx}`}
                                className={`h-full flex items-center justify-center transition-all duration-300 cursor-pointer border-r border-gray-900/40 relative group
                                    ${segment.bias === 'FAILED_BREAKOUT' ? 'h-2/3 mt-auto scale-y-100 opacity-90' : ''}
                                    ${segment.isLatest ? 'z-10' : ''}
                                    ${segment.color}
                                    ${isDimmed ? 'opacity-20 saturate-50' : 'opacity-100'}
                                    ${isFirst ? 'rounded-l-md' : ''}
                                    ${isLast ? 'rounded-r-md border-r-0' : ''}
                                `}
                                style={{
                                    width: `${segment.widthPct}%`,
                                    minWidth: '4px',
                                    backgroundImage: segment.bias === 'FAILED_BREAKOUT'
                                        ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 2px, transparent 2px, transparent 4px)'
                                        : 'none'
                                }}
                                onClick={() => {
                                    if (onSegmentClick && segment.bias !== 'NEUTRAL') {
                                        onSegmentClick(segment);
                                    } else {
                                        toggleFilter(segment.bias);
                                    }
                                }}
                            >
                                {/* Current Regime Marker */}
                                {segment.isLatest && (
                                    <div className="absolute -top-1 left-0 right-0 h-1 bg-white ring-2 ring-white/20 animate-pulse rounded-t-full shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                                )}

                                {/* Label text if segment is wide enough */}
                                {segment.widthPct > 8 && !isDimmed && (
                                    <span className="text-[9px] font-black text-white/80 truncate px-1 select-none pointer-events-none tracking-tighter">
                                        {segment.label}
                                    </span>
                                )}

                                {/* FAILED BREAKOUT ICON */}
                                {segment.bias === 'FAILED_BREAKOUT' && segment.widthPct > 3 && (
                                    <AlertCircle size={10} className="text-white/60 absolute" />
                                )}

                                {/* ENHANCED TOOLTIP */}
                                <div className={`opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full mb-3 z-[100] pointer-events-none transform translate-y-2 group-hover:translate-y-0 text-white
                                    ${(segment.offsetLeftPct < 20) ? 'left-0' : (segment.offsetLeftPct + segment.widthPct > 80) ? 'right-0' : 'left-1/2 -translate-x-1/2'}
                                `}>
                                    <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 text-xs w-64 text-left backdrop-blur-md bg-opacity-95 ring-1 ring-white/10 relative">
                                        <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                                            <div className="flex flex-col">
                                                <span className="font-black text-[12px] text-white tracking-wide uppercase">
                                                    {segment.bias.replace('_', ' ')} · {segment.confidence}
                                                </span>
                                            </div>
                                            {segment.isLatest && (
                                                <span className="px-2 py-0.5 bg-blue-500 text-[9px] font-bold text-white rounded-full animate-bounce">NOW</span>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-[11px] text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} className="text-gray-500" />
                                                <span className="text-white font-bold">Duration: {segment.timeLabel}</span>
                                                <span className="text-gray-500">({segment.duration} bars)</span>
                                            </div>

                                            {segment.narrative && (
                                                <div className="bg-gray-800/50 p-2 rounded border border-gray-700/50 text-gray-400 leading-relaxed italic">
                                                    {segment.narrative}
                                                </div>
                                            )}

                                            <div className="text-[10px] text-gray-500 pt-1 flex justify-between">
                                                <span>{new Date(segment.start_time).toLocaleDateString()}</span>
                                                {segment.transition_in && (
                                                    <span className="text-gray-600">Prev: {segment.transition_in}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`absolute top-full border-8 border-transparent border-t-gray-900 
                                            ${(segment.offsetLeftPct < 20) ? 'left-4' : (segment.offsetLeftPct + segment.widthPct > 80) ? 'right-4' : 'left-1/2 -translate-x-1/2'}
                                        `} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Enhanced Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-gray-400 mt-2 pl-1 z-10">
                {[
                    { bias: 'ACCUMULATION', label: 'Accumulation', color: 'bg-teal-500', glow: 'rgba(20,184,166,0.3)' },
                    { bias: 'DISTRIBUTION', label: 'Distribution', color: 'bg-rose-500', glow: 'rgba(244,63,94,0.3)' },
                    { bias: 'FAILED_BREAKOUT', label: 'Failed Breakout', color: 'bg-amber-500', glow: 'rgba(245,158,11,0.3)', stripe: true },
                    { bias: 'NEUTRAL', label: 'Neutral', color: 'bg-slate-600', glow: 'transparent' }
                ].map((item) => {
                    const isActive = activeFilter === item.bias;
                    const isOtherActive = activeFilter && activeFilter !== item.bias;

                    return (
                        <div
                            key={item.bias}
                            className={`flex items-center gap-2 cursor-pointer transition-all duration-200 
                                ${isOtherActive ? 'opacity-40 grayscale-50' : 'opacity-100'}
                                ${isActive ? 'scale-110' : 'hover:scale-105 group'}
                            `}
                            onClick={() => toggleFilter(item.bias)}
                            onMouseEnter={() => setHoveredBiasFilter(item.bias)}
                            onMouseLeave={() => setHoveredBiasFilter(null)}
                        >
                            <div className={`w-2.5 h-2.5 rounded shadow-[0_0_5px_${item.glow}] 
                                ${item.color} 
                                ${item.stripe ? 'stripe-small' : ''}
                                ${isActive ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''}
                            `}></div>
                            <span className={`transition-colors ${isActive ? 'text-white font-bold' : 'group-hover:text-white'}`}>
                                {item.label}
                            </span>
                            <span className={`px-1.5 rounded transition-colors 
                                ${isActive ? 'bg-white/10 text-white' : 'bg-gray-800 text-gray-500 font-bold'}
                            `}>
                                {counts[item.bias] || 0}
                            </span>
                        </div>
                    )
                })}
            </div>

            <style>{`
                .stripe-small {
                    background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px);
                }
            `}</style>
        </div>
    );
};

RegimeTimeline.propTypes = {
    regimeHistory: PropTypes.arrayOf(PropTypes.shape({
        start_time: PropTypes.string,
        end_time: PropTypes.string,
        bias: PropTypes.string,
        confidence: PropTypes.string,
        duration: PropTypes.number,
        transition_in: PropTypes.string,
        narrative: PropTypes.string
    })),
    timeframe: PropTypes.string,
    onSegmentClick: PropTypes.func
};

export default RegimeTimeline;
