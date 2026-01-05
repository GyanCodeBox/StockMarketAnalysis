import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Info, Activity, ShieldCheck, Target } from 'lucide-react';

const DecisionBrief = ({ brief, fallback = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!brief) return null;

    let data;
    try {
        data = typeof brief === 'string' ? JSON.parse(brief) : brief;
    } catch (e) {
        console.error("Failed to parse decision brief JSON", e);
        return (
            <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400 italic">Structured decision brief unavailable due to formatting error.</p>
            </div>
        );
    }

    const { headline, primary_observation, dominant_risk, monitoring_points, confidence_note } = data;

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl transition-all duration-300">
            {/* Header / Headline */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center ring-1 ring-indigo-500/20 group-hover:ring-indigo-500/40 transition-all">
                        <Activity size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider leading-tight">
                            AI Decision Brief
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1 group-hover:text-slate-200 transition-colors">
                            {headline}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 bg-slate-950/50 rounded border border-white/5">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter italic">Synthesized</span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] border-t border-slate-800/50' : 'max-h-0'}`}>
                <div className="p-6 space-y-6">
                    {/* Primary Observation */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Target size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Observation</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed font-medium">
                            {primary_observation}
                        </p>
                    </div>

                    {/* Dominant Risk */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-amber-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dominant Risk Constraint</span>
                        </div>
                        <p className="text-sm text-amber-100/80 leading-relaxed font-medium">
                            {dominant_risk}
                        </p>
                    </div>

                    {/* Monitoring Points */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Structural Monitoring Priorities</span>
                        </div>
                        <ul className="space-y-2">
                            {monitoring_points && monitoring_points.map((point, i) => (
                                <li key={i} className="flex items-start gap-3 group">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 transition-colors" />
                                    <span className="text-[13px] text-slate-300 font-medium leading-tight">
                                        {point}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Footer / Context */}
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <Info size={12} className="text-slate-500" />
                            <p className="text-[9px] text-slate-500 italic font-medium">
                                Generated from computed regimes and structural constraints. Not a recommendation or directional prediction.
                            </p>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                            Ref: {confidence_note}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DecisionBrief;
