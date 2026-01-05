import React from 'react';
import { Target, BarChart2, TrendingUp, Zap, AlertTriangle, CheckCircle, ArrowDownCircle } from 'lucide-react';

export default function TechnicalScoreCard({ scoreData }) {
    if (!scoreData) return null;

    const { total_score, grade, color, components, signals } = scoreData;

    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">

                {/* Left: Overall Score & Gauge */}
                <div className="flex flex-col items-center justify-center space-y-4 min-w-[200px]">
                    <div className="w-40 h-40 relative">
                        <CircularProgress value={total_score} color={color} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-bold text-white tracking-tighter shadow-sm">{total_score}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Strength Index</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            {grade}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Technical Strength</p>
                    </div>
                </div>

                {/* Center: Detailed Breakdown */}
                <div className="flex-1 w-full space-y-5">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-300">Score Breakdown</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <ScoreBar
                            label="MA Position"
                            icon={<Target className="w-3 h-3" />}
                            value={components.ma_position}
                            max={50}
                            color={color}
                        />
                        <ScoreBar
                            label="Volume"
                            icon={<BarChart2 className="w-3 h-3" />}
                            value={components.volume}
                            max={25}
                            color={color}
                        />
                        <ScoreBar
                            label="Trend"
                            icon={<TrendingUp className="w-3 h-3" />}
                            value={components.trend}
                            max={15}
                            color={color}
                        />
                        <ScoreBar
                            label="Momentum"
                            icon={<Zap className="w-3 h-3" />}
                            value={components.momentum}
                            max={10}
                            color={color}
                        />
                    </div>
                </div>

                {/* Right: Key Signals */}
                <div className="flex-1 w-full md:border-l md:border-slate-800 md:pl-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-300">Key Signals</h4>
                    </div>

                    <div className="space-y-3">
                        {signals.map((signal, index) => {
                            let Icon = CheckCircle;
                            let iconColor = "text-emerald-500";

                            if (signal.includes('⚠️')) {
                                Icon = AlertTriangle;
                                iconColor = "text-yellow-500";
                            } else if (signal.includes('🔻')) {
                                Icon = ArrowDownCircle;
                                iconColor = "text-rose-500";
                            }

                            return (
                                <div key={index} className="flex items-start gap-3 text-sm group">
                                    <Icon className={`w-4 h-4 ${iconColor} mt-0.5 shrink-0 transition-transform group-hover:scale-110`} />
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors leading-snug">
                                        {signal.replace(/✅|⚠️|🔻/g, '').trim()}
                                    </span>
                                </div>
                            );
                        })}
                        {signals.length === 0 && (
                            <p className="text-sm text-slate-500 italic">No strong signals detected.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Disclaimer Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/50">
                <p className="text-[9px] text-slate-500 italic">
                    Structural quantitative analysis. Scoring evaluates market context and price-volume alignment, not directional predictability.
                </p>
            </div>
        </div>
    );
}

function ScoreBar({ label, value, max, color, icon }) {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));

    return (
        <div className="group">
            <div className="flex justify-between text-xs mb-1.5 items-center">
                <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="text-slate-500 font-mono">
                    <span className="text-slate-300 font-bold">{value}</span>
                    <span className="text-slate-600">/{max}</span>
                </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)] relative"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color
                    }}
                >
                    <div className="absolute inset-0 bg-white/20"></div>
                </div>
            </div>
        </div>
    );
}

function CircularProgress({ value, color }) {
    const radius = 54; // Slightly larger
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background track */}
            <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#1e293b" // slate-800
                strokeWidth="8"
                strokeLinecap="round"
            />
            {/* Progress arc */}
            <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out shadow-lg drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            />
        </svg>
    );
}
