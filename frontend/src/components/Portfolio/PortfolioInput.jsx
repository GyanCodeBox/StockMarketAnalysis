import React, { useState } from 'react';
import { Upload, ArrowRight, Activity, AlertCircle } from 'lucide-react';

const PortfolioInput = ({ onAnalyze, loading }) => {
    const [inputText, setInputText] = useState('');
    const [inputMode, setInputMode] = useState('text'); // 'text' | 'csv'

    const handleSubmit = () => {
        if (!inputText.trim()) return;

        // rudimentary split by newline, comma, space, filter empty
        const symbols = inputText
            .split(/[\n,\s]+/)
            .map(s => s.trim().toUpperCase())
            .filter(s => s.length > 0);

        if (symbols.length === 0) return;

        // De-duplicate
        const uniqueSymbols = [...new Set(symbols)];

        onAnalyze(uniqueSymbols);
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-w-2xl mx-auto mt-12 p-8 animate-fade-in-up">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]">
                    <Activity size={32} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Portfolio Regime Monitor</h2>
                <p className="text-slate-400 mt-2 font-medium">Bulk analyze risk & confluence across your holdings</p>
            </div>

            <div className="flex bg-slate-950/50 p-1 rounded-xl mb-6 border border-slate-800/50 w-fit mx-auto">
                <button
                    onClick={() => setInputMode('text')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${inputMode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Paste Symbols
                </button>
                <button
                    onClick={() => setInputMode('csv')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${inputMode === 'csv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    CSV Upload
                </button>
            </div>

            {inputMode === 'text' ? (
                <div className="space-y-4">
                    <div className="relative group">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="RELIANCE&#10;TCS&#10;HDFCBANK&#10;INFY"
                            className="w-full h-48 bg-slate-950 border border-slate-700/50 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none placeholder:text-slate-700 placeholder:leading-6"
                        />
                        <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800 pointer-events-none">
                            Method 1
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium px-1">
                        <AlertCircle size={12} />
                        <span>Supports Newline, Comma, or Space separated symbols</span>
                    </div>
                </div>
            ) : (
                <div className="h-48 bg-slate-950/30 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3 group hover:border-indigo-500/30 transition-all cursor-not-allowed">
                    <Upload size={24} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">CSV Upload Coming Soon</p>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading || (inputMode === 'text' && !inputText.trim()) || inputMode === 'csv'}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                    </>
                ) : (
                    <>
                        Start Analysis <ArrowRight size={16} />
                    </>
                )}
            </button>
        </div>
    );
};

export default PortfolioInput;
