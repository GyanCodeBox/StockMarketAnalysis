import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ShareholdingPattern = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 flex items-center justify-center h-80">
                <p className="text-slate-400">No shareholding data available</p>
            </div>
        );
    }

    // Transform data for Recharts
    const chartData = data.slice(0, 4).map(item => ({
        name: item.holder,
        value: parseFloat(item.percentHeld)
    }));

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-200 mb-6">Shareholding Pattern</h3>

            {/* Centered Pie Chart */}
            <div className="h-[280px] w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                            itemStyle={{ color: '#cbd5e1' }}
                            formatter={(value) => `${value}%`}
                        />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mt-2">
                {data.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                        <p className="text-xs text-slate-500 uppercase truncate">{item.holder}</p>
                        <p className="text-lg font-mono text-indigo-400">{item.percentHeld}%</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShareholdingPattern;
