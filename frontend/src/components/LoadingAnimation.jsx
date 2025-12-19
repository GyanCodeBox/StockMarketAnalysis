import React, { useState, useEffect } from 'react';

const LoadingAnimation = ({ symbol }) => {
    const [progress, setProgress] = useState(0);

    // Simulated progress bar (aesthetic only)
    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return prev; // Cap at 95% until actual completion
                return prev + Math.random() * 5;
            });
        }, 400);

        return () => clearInterval(progressInterval);
    }, []);

    return (
        <div className="py-12 px-6">
            <div className="max-w-2xl w-full mx-auto space-y-10">
                {/* Animated Logo/Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl animate-pulse">📊</span>
                        </div>
                    </div>
                </div>

                {/* Main Status */}
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        Analyzing {symbol}
                    </h2>
                    <p className="text-slate-400 text-lg font-light">
                        Gathering intelligence and running model predictions...
                    </p>
                </div>

                {/* Progress Bar Container */}
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono text-indigo-400 uppercase tracking-widest">
                        <span>Processing Engine</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 p-1 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Analysis Steps - Simplified Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex items-center space-x-3">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                        <span className="text-slate-400">MARKET DATA SYNC</span>
                    </div>
                    <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex items-center space-x-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-75 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                        <span className="text-slate-400">TECHNICAL OVERLAY</span>
                    </div>
                    <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        <span className="text-slate-400">FUNDAMENTAL AUDIT</span>
                    </div>
                    <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/50 flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-300 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                        <span className="text-slate-400">LLM REASONING</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation;
