import React from 'react';
import { Activity, ShieldAlert, BarChart3, PieChart } from 'lucide-react';

const StatCard = ({ label, value, subtext, icon, color }) => (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-4 flex items-center gap-4 min-w-[200px] flex-1">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg} ${color.border} border`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-0.5">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">{value}</span>
                {subtext && <span className="text-[10px] font-medium text-slate-400">{subtext}</span>}
            </div>
        </div>
    </div>
);

const PortfolioSummaryBar = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
                label="Total Universe"
                value={summary.total_stocks}
                subtext="Stocks Tracked"
                icon={<PieChart size={18} className="text-indigo-400" />}
                color={{ bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }}
            />
            <StatCard
                label="Aligned Strength"
                value={`${summary.aligned_strength_pct}%`}
                subtext={`${Math.round(summary.total_stocks * (summary.aligned_strength_pct / 100))} Stocks`}
                icon={<BarChart3 size={18} className="text-emerald-400" />}
                color={{ bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }}
            />
            <StatCard
                label="High Risk"
                value={`${summary.high_risk_pct}%`}
                subtext="Constraints Triggered"
                icon={<ShieldAlert size={18} className="text-amber-400" />}
                color={{ bg: 'bg-amber-500/10', border: 'border-amber-500/20' }}
            />
            <StatCard
                label="Critical Attention"
                value={summary.attention_distribution.CRITICAL || 0}
                subtext="Immediate Action"
                icon={<Activity size={18} className="text-red-400" />}
                color={{ bg: 'bg-red-500/10', border: 'border-red-500/20' }}
            />
        </div>
    );
};

export default PortfolioSummaryBar;
