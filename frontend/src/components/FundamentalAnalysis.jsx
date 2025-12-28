import React from 'react';
import LazyAccordionSection from './LazyAccordionSection';
import ShareholdingPattern from './ShareholdingPattern';
import FinancialCharts from './FinancialCharts';
import FundamentalHealthBanner from './FundamentalHealthBanner';

const FundamentalAnalysis = ({ symbol, exchange }) => {
    const requestParams = { symbol, exchange };

    return (
        <div id="fundamental-section" className="space-y-8 animate-fade-in-up">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <span className="w-2 h-10 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                        Fundamental Analysis
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 ml-5">Phase 1: Momentum, Quality & Efficiency</p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto uppercase tracking-tighter">
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-500 text-[10px] font-bold">
                        Data: Quarterly Filings
                    </span>
                </div>
            </div>

            {/* Main Financial Section */}
            <LazyAccordionSection
                title="Business Performance & Quality Score"
                icon="💎"
                description="Overall health score, YoY trends, and capital efficiency"
                endpoint="/api/fundamental/financials"
                requestParams={requestParams}
                defaultOpen={true}
            >
                {(data) => {
                    if (!data || !data.score) return (
                        <div className="p-8 text-center text-slate-500 font-medium">
                            No fundamental data available for this symbol.
                        </div>
                    );

                    return (
                        <div className="space-y-8">
                            {/* 1. Fundamental Health Banner (Score & Grade) */}
                            <FundamentalHealthBanner scoreData={data.score} />

                            {/* 2. Modular Analysis Sections (Chart + Data Dual Mode) */}
                            <FinancialCharts data={data} />
                        </div>
                    );
                }}
            </LazyAccordionSection>

            {/* Shareholding Pattern Section */}
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
        </div>
    );
};

export default FundamentalAnalysis;
