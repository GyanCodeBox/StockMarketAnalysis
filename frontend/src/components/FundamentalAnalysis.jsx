import React from 'react';
import LazyAccordionSection from './LazyAccordionSection';
import ShareholdingPattern from './ShareholdingPattern';
import FinancialCharts from './FinancialCharts';
import AIAnalysisDisplay from './AIAnalysisDisplay'; // Reusing for markdown display

const StatisticCard = ({ label, value, subtext, trend }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-indigo-500/30 transition-all">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{label}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-white">
                {value}
            </h3>
            {trend !== undefined && trend !== null && (
                <span className={`text-xs font-bold ${parseFloat(trend) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(trend) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(trend))}%
                </span>
            )}
        </div>
        {subtext && <p className="text-[10px] text-slate-500 mt-1 font-medium">{subtext}</p>}
    </div>
);

const FundamentalAnalysis = ({ symbol, exchange }) => {
    const requestParams = { symbol, exchange };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <span className="w-2 h-10 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></span>
                        Fundamental Analysis
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 ml-5">Comprehensive institutional-grade financial data</p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                        Source: FMP
                    </span>
                </div>
            </div>

            {/* 1. Financial Performance Section */}
            <LazyAccordionSection
                title="Financial Performance (5Y)"
                icon="📊"
                description="View EPS trends, Sales growth, and Profit margins"
                endpoint="/api/fundamental/financials"
                requestParams={requestParams}
            >
                {(data) => {
                    const cagr = data.cagr || {};
                    const yearly = data.yearly || [];
                    const latest = yearly[0] || {};
                    const latestRev = latest.revenue ? (latest.revenue / 10000000).toFixed(2) + ' Cr' : 'N/A';

                    return (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatisticCard
                                    label="5Y EPS CAGR"
                                    value={`${cagr.eps_5y || 0}%`}
                                    subtext="Profit Growth Velocity"
                                    trend={cagr.eps_5y}
                                />
                                <StatisticCard
                                    label="5Y Sales CAGR"
                                    value={`${cagr.sales_5y || 0}%`}
                                    subtext="Revenue Expansion Rate"
                                    trend={cagr.sales_5y}
                                />
                                <StatisticCard
                                    label="Annual Revenue"
                                    value={latestRev}
                                    subtext={`FY ${latest.year || 'N/A'}`}
                                    trend={latest.revenue_growth}
                                />
                                <StatisticCard
                                    label="Annual EPS"
                                    value={latest.eps ? latest.eps.toFixed(2) : 'N/A'}
                                    subtext="Earnings per share"
                                    trend={latest.eps_growth}
                                />
                            </div>
                            <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-4">
                                <FinancialCharts data={data} />
                            </div>
                        </div>
                    );
                }}
            </LazyAccordionSection>

            {/* 2. Shareholding Pattern Section */}
            <LazyAccordionSection
                title="Shareholding Pattern"
                icon="👥"
                description="Promoter, FII, and DII holding structure"
                endpoint="/api/fundamental/shareholding"
                requestParams={requestParams}
            >
                {(data) => (
                    <div className="max-w-4xl mx-auto py-4">
                        <ShareholdingPattern data={data} />
                    </div>
                )}
            </LazyAccordionSection>

            {/* 3. AI Fundamental Insights Section */}
            <LazyAccordionSection
                title="AI Fundamental Intelligence"
                icon="🤖"
                description="Deep dive analysis into financial health and risks"
                endpoint="/api/fundamental/ai-insights"
                requestParams={requestParams}
            >
                {(data) => (
                    <div className="animate-fade-in">
                        <AIAnalysisDisplay analysis={data.analysis} />
                    </div>
                )}
            </LazyAccordionSection>
        </div>
    );
};

export default FundamentalAnalysis;
