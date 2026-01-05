import React from 'react';
import { AlertTriangle, ShieldAlert, TrendingDown, DollarSign } from 'lucide-react';

const RiskConstraintPanel = ({ riskConstraints, riskSummary }) => {
    if (!riskConstraints || riskConstraints.length === 0) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-950/50 rounded-lg border border-emerald-500/20">
                        <ShieldAlert size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            Risk Constraints
                        </h3>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            Constraint Analysis
                        </p>
                    </div>
                </div>
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                    <p className="text-sm text-emerald-400 font-bold">
                        ✓ No significant risk constraints identified
                    </p>
                </div>
            </div>
        );
    }

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'HIGH':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    text: 'text-red-400',
                    icon: 'text-red-400',
                    badge: 'bg-red-500/20 text-red-400 border-red-500/30'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    text: 'text-amber-400',
                    icon: 'text-amber-400',
                    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                };
            default: // LOW
                return {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/20',
                    text: 'text-slate-400',
                    icon: 'text-slate-400',
                    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                };
        }
    };

    const getDimensionIcon = (dimension) => {
        switch (dimension) {
            case 'Earnings Quality':
                return <DollarSign size={14} />;
            case 'Capital Efficiency':
                return <TrendingDown size={14} />;
            case 'Price Structure':
                return <TrendingDown size={14} />;
            case 'Margin Pressure':
                return <AlertTriangle size={14} />;
            default:
                return <AlertTriangle size={14} />;
        }
    };

    const getOverallRiskColor = () => {
        if (!riskSummary) return 'text-slate-400';
        const level = riskSummary.overall_risk;
        if (level === 'HIGH' || level === 'MEDIUM-HIGH') return 'text-red-400';
        if (level === 'MEDIUM') return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-950/50 rounded-lg border border-red-500/20">
                            <ShieldAlert size={18} className="text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">
                                Risk Constraints
                            </h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Institutional Monitoring Dimensions
                            </p>
                        </div>
                    </div>

                    {riskSummary && (
                        <div className="text-right">
                            <p className={`text-sm font-black uppercase tracking-wider ${getOverallRiskColor()}`}>
                                {riskSummary.overall_risk}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                Aggregate Severity
                            </p>
                        </div>
                    )}
                </div>

                {/* Summary */}
                {riskSummary && (
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                            <span className="text-slate-500 mr-2">⚠</span>
                            {riskSummary.summary}
                        </p>
                        <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500">
                            <span>Total Constraints: {riskSummary.constraint_count}</span>
                            {riskSummary.high_severity_count > 0 && (
                                <span className="text-red-400">High: {riskSummary.high_severity_count}</span>
                            )}
                            {riskSummary.medium_severity_count > 0 && (
                                <span className="text-amber-400">Medium: {riskSummary.medium_severity_count}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Constraints List */}
                <div className="space-y-3">
                    {riskConstraints.map((constraint, index) => {
                        const styles = getSeverityStyles(constraint.severity);
                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-xl border ${styles.border} ${styles.bg} transition-all hover:shadow-lg`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={styles.icon}>
                                            {getDimensionIcon(constraint.dimension)}
                                        </span>
                                        <h4 className={`text-sm font-black uppercase tracking-tight ${styles.text}`}>
                                            {constraint.dimension}
                                        </h4>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles.badge}`}>
                                        {constraint.severity}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-200 font-medium leading-relaxed mb-3">
                                    {constraint.statement}
                                </p>

                                {/* Metrics */}
                                {(constraint.metric_value !== undefined || constraint.threshold !== undefined) && (
                                    <div className="flex gap-4 text-[10px] font-bold">
                                        {constraint.metric_value !== undefined && (
                                            <span className="text-slate-400">
                                                Current: <span className={styles.text}>{constraint.metric_value}%</span>
                                            </span>
                                        )}
                                        {constraint.threshold !== undefined && (
                                            <span className="text-slate-400">
                                                Threshold: <span className="text-slate-300">{constraint.threshold}%</span>
                                            </span>
                                        )}
                                        {constraint.gap !== undefined && (
                                            <span className="text-slate-400">
                                                Gap: <span className={styles.text}>{constraint.gap}%</span>
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Institutional Note */}
                                {constraint.institutional_note && (
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        <p className="text-[10px] text-slate-400 italic leading-relaxed">
                                            {constraint.institutional_note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Note */}
                <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        <span className="text-indigo-400 font-bold">Risk Framework:</span> Constraints identify factors that limit upside potential or increase downside vulnerability. This is not a sell signal—it's a risk containment framework.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiskConstraintPanel;
