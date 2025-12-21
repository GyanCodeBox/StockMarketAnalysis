import React, { useState, useEffect } from 'react';
import { Settings, X, Plus, RotateCcw, Check } from 'lucide-react';

export const TIMEFRAME_DEFAULTS = {
    'day': [
        { type: 'SMA', period: 50, color: '#f59e0b', width: 2, enabled: true },
        { type: 'SMA', period: 200, color: '#3b82f6', width: 2, enabled: true }
    ],
    'week': [
        { type: 'WMA', period: 10, color: '#f59e0b', width: 2, enabled: true },
        { type: 'WMA', period: 40, color: '#3b82f6', width: 2, enabled: true }
    ],
    'hour': [
        { type: 'EMA', period: 21, color: '#10b981', width: 2, enabled: true }
    ],
    '15minute': [
        { type: 'EMA', period: 21, color: '#10b981', width: 2, enabled: true },
        { type: 'EMA', period: 50, color: '#f59e0b', width: 2, enabled: false }
    ],
    '5minute': [
        { type: 'EMA', period: 9, color: '#ef4444', width: 2, enabled: true },
        { type: 'EMA', period: 21, color: '#10b981', width: 2, enabled: true }
    ]
};

export default function ChartSettings({
    symbol,
    timeframe,
    onConfigChange
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [movingAverages, setMovingAverages] = useState([]);

    // Load saved preferences or defaults
    useEffect(() => {
        const savedPrefs = localStorage.getItem(`chart_prefs_${symbol}_${timeframe}`);

        if (savedPrefs) {
            try {
                const prefs = JSON.parse(savedPrefs);
                setMovingAverages(prefs);
            } catch (e) {
                setMovingAverages(TIMEFRAME_DEFAULTS[timeframe] || TIMEFRAME_DEFAULTS['day']);
            }
        } else {
            setMovingAverages(TIMEFRAME_DEFAULTS[timeframe] || TIMEFRAME_DEFAULTS['day']);
        }
    }, [symbol, timeframe]);

    const toggleMA = (index) => {
        const updated = [...movingAverages];
        updated[index].enabled = !updated[index].enabled;
        setMovingAverages(updated);
    };

    const updateMAField = (index, field, value) => {
        const updated = [...movingAverages];
        updated[index][field] = field === 'period' || field === 'width' ? parseInt(value) || 0 : value;
        setMovingAverages(updated);
    };

    const addCustomMA = () => {
        setMovingAverages([
            ...movingAverages,
            { type: 'SMA', period: 20, color: '#8b5cf6', width: 2, enabled: true }
        ]);
    };

    const removeMA = (index) => {
        setMovingAverages(movingAverages.filter((_, i) => i !== index));
    };

    const applySettings = () => {
        // Save preferences
        localStorage.setItem(`chart_prefs_${symbol}_${timeframe}`, JSON.stringify(movingAverages));

        // Update chart
        onConfigChange(movingAverages);
        setIsOpen(false);
    };

    const resetToDefaults = () => {
        setMovingAverages(TIMEFRAME_DEFAULTS[timeframe] || TIMEFRAME_DEFAULTS['day']);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg transition-all text-slate-300 text-sm font-medium"
                title="Chart Settings"
            >
                <Settings className="w-4 h-4" />
                Settings
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Settings className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Chart Configuration</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Moving Averages</h3>
                            <span className="text-xs text-slate-500">Config for {timeframe}</span>
                        </div>

                        <div className="space-y-3">
                            {movingAverages.map((ma, index) => (
                                <div key={index} className="group flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={ma.enabled}
                                        onChange={() => toggleMA(index)}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 transition-colors cursor-pointer"
                                    />

                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={ma.period}
                                                onChange={(e) => updateMAField(index, 'period', e.target.value)}
                                                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 focus:border-purple-500 focus:outline-none transition-all"
                                                placeholder="Period"
                                                disabled={!ma.enabled}
                                            />
                                            <span className="absolute right-2 top-1 text-[10px] text-slate-500 uppercase">{ma.type}</span>
                                        </div>
                                        <select
                                            value={ma.type}
                                            onChange={(e) => updateMAField(index, 'type', e.target.value)}
                                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:border-purple-500 focus:outline-none transition-all"
                                            disabled={!ma.enabled}
                                        >
                                            <option value="SMA">SMA</option>
                                            <option value="EMA">EMA</option>
                                            <option value="WMA">WMA</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={ma.color}
                                            onChange={(e) => updateMAField(index, 'color', e.target.value)}
                                            className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer"
                                            disabled={!ma.enabled}
                                        />
                                        <select
                                            value={ma.width}
                                            onChange={(e) => updateMAField(index, 'width', e.target.value)}
                                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                                            disabled={!ma.enabled}
                                        >
                                            <option value="1">1px</option>
                                            <option value="2">2px</option>
                                            <option value="3">3px</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => removeMA(index)}
                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={addCustomMA}
                            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-800/20 rounded-xl transition-all text-slate-400 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Custom Indicator
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all text-sm font-medium"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-6 py-2 hover:bg-slate-800 rounded-xl text-slate-300 transition-all text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={applySettings}
                            className="flex items-center gap-2 px-8 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/20 rounded-xl text-white transition-all text-sm font-bold"
                        >
                            <Check className="w-4 h-4" />
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
