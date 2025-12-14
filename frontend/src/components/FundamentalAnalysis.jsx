import React from 'react';
import ShareholdingPattern from './ShareholdingPattern';
import FinancialCharts from './FinancialCharts';

const StatisticCard = ({ label, value, subtext, trend }) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-indigo-500/50 transition-colors">
        <p className="text-sm text-slate-400 font-medium mb-1">{label}</p>
        <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {value}
            </h3>
            {trend && (
                <span className={`text-sm font-medium mb-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        {subtext && <p className="text-xs text-slate-500 mt-2">{subtext}</p>}
    </div>
);

const FundamentalAnalysis = ({ data }) => {
    if (!data) return null;

    const financials = data.financials || {};
    const cagr = financials.cagr || {};
    const yearly = financials.yearly || [];
    const latestYear = yearly[0] || {};

    // Clean values
    const epsCagr = cagr.eps_5y !== undefined ? cagr.eps_5y : 'N/A';
    const salesCagr = cagr.sales_5y !== undefined ? cagr.sales_5y : 'N/A';
    const latestRev = latestYear.revenue ? (latestYear.revenue / 10000000).toFixed(2) + ' Cr' : 'N/A';
    const latestEps = latestYear.eps ? latestYear.eps.toFixed(2) : 'N/A';

    // Last year growth
    const salesGrowth = latestYear.revenue_growth ? parseFloat(latestYear.revenue_growth).toFixed(2) : null;
    // Note: logic for revenue_growth might not be in 'yearly' list from backend, checking fundamental_tool.py...
    // fundamental_tool.py adds 'eps_growth' to yearly_df, but logic for 'revenue_growth' was missing in my prev thought?
    // Let's check: df['eps_growth'] = yearly_df['eps'].pct_change() * 100. I didn't add revenue growth in yearly.
    // I will just use eps_growth for now.

    const epsGrowth = latestYear.eps_growth ? parseFloat(latestYear.eps_growth).toFixed(2) : null;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                    Fundamental Overview
                </h2>
                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-mono">
                    DATA: FINANCIAL MODELING PREP
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatisticCard
                    label="EPS Growth (5Y CAGR)"
                    value={`${epsCagr}%`}
                    subtext="Compound Annual Growth Rate"
                    trend={epsCagr}
                />
                <StatisticCard
                    label="Sales Growth (5Y CAGR)"
                    value={`${salesCagr}%`}
                    subtext="Top-line growth trajectory"
                    trend={salesCagr}
                />
                <StatisticCard
                    label="Latest Annual Revenue"
                    value={latestRev}
                    subtext="Most recent full year"
                />
                <StatisticCard
                    label="Latest Annual EPS"
                    value={latestEps}
                    subtext="Earnings per share"
                    trend={epsGrowth}
                />
            </div>

            {/* Charts Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Financial Charts (2/3 width) */}
                <div className="lg:col-span-2">
                    <FinancialCharts data={financials} />
                </div>

                {/* Right Col: Ownership (1/3 width) */}
                <div className="lg:col-span-1">
                    <ShareholdingPattern data={data.ownership} />
                </div>
            </div>
        </div>
    );
};

export default FundamentalAnalysis;
