import React from 'react';
import LazyAccordionSection from './LazyAccordionSection';
import ConfluenceBanner from './ConfluenceBanner';
import CompositeScoreIndicator from './CompositeScoreIndicator';
import RiskConstraintPanel from './RiskConstraintPanel';
import { Brain, TrendingUp, Activity } from 'lucide-react';

const DecisionIntelligence = ({ symbol, exchange }) => {
    const requestParams = { symbol, exchange };

    return (
        <div id="decision-intelligence-section" className="space-y-8 animate-fade-in-up">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <span className="w-2 h-10 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                        Decision Intelligence
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 ml-5">
                        Phase 2: Tech-Fundamental Confluence & Risk Assessment
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto uppercase tracking-tighter">
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-500 text-[10px] font-bold">
                        Institutional Framework
                    </span>
                </div>
            </div>

            {/* Main Decision Intelligence Section */}
            <LazyAccordionSection
                title="Regime Confluence & Risk Profile"
                icon="🎯"
                description="Tech-fundamental alignment, composite scoring, and risk constraints"
                endpoint="/api/analysis/summary"
                requestParams={requestParams}
                defaultOpen={true}
            >
                {(data) => {
                    if (!data || !data.confluence) {
                        return (
                            <div className="p-8 text-center text-slate-500 font-medium">
                                No decision intelligence data available for this symbol.
                            </div>
                        );
                    }

                    return (
                        <div className="space-y-8">
                            {/* 1. Confluence Banner (Primary) */}
                            <ConfluenceBanner confluenceData={data.confluence} />

                            {/* 2. Metrics Grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Composite Score */}
                                <CompositeScoreIndicator compositeData={data.composite_score} />

                                {/* Risk Constraints */}
                                <RiskConstraintPanel
                                    riskConstraints={data.risk_constraints}
                                    riskSummary={data.risk_summary}
                                />
                            </div>

                            {/* 3. Regime Details (Collapsible) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Technical State */}
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <TrendingUp size={16} className="text-indigo-400" />
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">
                                            Technical State
                                        </h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Regime</span>
                                            <span className="text-sm text-white font-black">
                                                {data.technical_state?.regime}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Confidence</span>
                                            <span className="text-sm text-white font-black">
                                                {data.technical_state?.confidence}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Duration</span>
                                            <span className="text-sm text-white font-black">
                                                {data.technical_state?.duration_formatted}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Score</span>
                                            <span className="text-sm text-indigo-400 font-black">
                                                {data.technical_state?.score}/100
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fundamental State */}
                                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity size={16} className="text-emerald-400" />
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">
                                            Fundamental State
                                        </h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Regime</span>
                                            <span className="text-sm text-white font-black">
                                                {data.fundamental_state?.regime}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Phase</span>
                                            <span className="text-sm text-white font-black">
                                                {data.fundamental_state?.phase}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Duration</span>
                                            <span className="text-sm text-white font-black">
                                                {data.fundamental_state?.duration_quarters} quarters (~{Math.floor(data.fundamental_state?.duration_quarters / 4)} years)
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 font-bold">Score</span>
                                            <span className="text-sm text-emerald-400 font-black">
                                                {data.fundamental_state?.score}/100
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stability Metrics (Optional Detail) */}
                            {data.stability_metrics && (
                                <details className="group">
                                    <summary className="cursor-pointer bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800 rounded-xl p-4 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Brain size={16} className="text-purple-400" />
                                                <span className="text-sm font-black text-white uppercase tracking-tight">
                                                    Regime Stability Metrics
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-bold group-open:rotate-180 transition-transform">
                                                ▼
                                            </span>
                                        </div>
                                    </summary>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/30 rounded-xl border border-slate-800/50">
                                        <div>
                                            <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                                Technical Stability
                                            </h5>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Volatility</span>
                                                    <span className="text-white font-bold">
                                                        {data.stability_metrics.technical?.volatility?.toFixed(3)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Persistence Rate</span>
                                                    <span className="text-white font-bold">
                                                        {(data.stability_metrics.technical?.persistence_rate * 100)?.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Stability Score</span>
                                                    <span className="text-indigo-400 font-bold">
                                                        {data.stability_metrics.technical?.score?.toFixed(1)}/100
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                                                Fundamental Stability
                                            </h5>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Phase Changes</span>
                                                    <span className="text-white font-bold">
                                                        {data.stability_metrics.fundamental?.phase_changes}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Stability Score</span>
                                                    <span className="text-emerald-400 font-bold">
                                                        {data.stability_metrics.fundamental?.score?.toFixed(1)}/100
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            )}
                        </div>
                    );
                }}
            </LazyAccordionSection>
        </div>
    );
};

export default DecisionIntelligence;
