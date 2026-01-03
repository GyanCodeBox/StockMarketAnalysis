import React, { useState } from 'react';
import PortfolioInput from './PortfolioInput';
import PortfolioSummaryBar from './PortfolioSummaryBar';
import PortfolioTable from './PortfolioTable';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PortfolioView = () => {
    const navigate = useNavigate();
    const [viewState, setViewState] = useState('input'); // 'input' | 'dashboard'
    const [loading, setLoading] = useState(false);
    const [portfolioData, setPortfolioData] = useState(null);
    const [activeFilter, setActiveFilter] = useState('ALL');

    const handleAnalyze = async (symbols) => {
        setLoading(true);
        try {
            const res = await fetch('/api/portfolio/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols, exchange: 'NSE' })
            });

            if (res.ok) {
                const data = await res.json();
                setPortfolioData(data);
                setViewState('dashboard');
            } else {
                console.error("Failed to fetch portfolio summary");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setPortfolioData(null);
        setViewState('input');
        setActiveFilter('ALL');
    };

    // Filter Logic
    const filteredStocks = portfolioData?.stocks?.filter(stock => {
        if (activeFilter === 'ALL') return true;
        return stock.attention_flag === activeFilter;
    }) || [];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <LayoutDashboard size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">Portfolio View</h1>
                            <p className="text-slate-400 text-xs font-medium">Regime & Risk Monitor</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                    >
                        Back to Terminal
                    </button>
                </header>

                {viewState === 'input' ? (
                    <PortfolioInput onAnalyze={handleAnalyze} loading={loading} />
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Summary Bar */}
                        <PortfolioSummaryBar summary={portfolioData?.summary} />

                        {/* Filter Bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800">
                                {['ALL', 'CRITICAL', 'REVIEW', 'MONITOR', 'STABLE'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter
                                                ? 'bg-indigo-600 text-white shadow-lg'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleClear}
                                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/5 group"
                            >
                                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                                New Analysis
                            </button>
                        </div>

                        {/* Main Table */}
                        <PortfolioTable stocks={filteredStocks} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioView;
