import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function QuickMAToggles({ movingAverages, onToggle }) {
    if (!movingAverages || movingAverages.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">Indicators</span>
            {movingAverages.map((ma, index) => (
                <button
                    key={`${ma.type}-${ma.period}-${index}`}
                    onClick={() => onToggle(index)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${ma.enabled
                            ? 'bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                >
                    <div
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{
                            backgroundColor: ma.color,
                            opacity: ma.enabled ? 1 : 0.3
                        }}
                    />
                    <span>{ma.period} {ma.type}</span>
                    {ma.enabled ? (
                        <Eye className="w-3 h-3 text-slate-400" />
                    ) : (
                        <EyeOff className="w-3 h-3 text-slate-600" />
                    )}
                </button>
            ))}
        </div>
    );
}
