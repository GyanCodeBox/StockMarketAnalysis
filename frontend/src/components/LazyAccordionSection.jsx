import { useState } from 'react';
import axios from 'axios';

/**
 * LazyAccordionSection - Loads data only when first expanded.
 * 
 * @param {string} title - Section heading
 * @param {string} icon - Emoji or icon component
 * @param {string} description - Brief subtitle
 * @param {string} endpoint - API endpoint for fetching data
 * @param {object} requestParams - Parameters for the POST request (symbol, exchange, etc.)
 * @param {function} children - Render prop function that receives the loaded data
 */
function LazyAccordionSection({ title, icon, description, endpoint, requestParams, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleToggle = async () => {
        // If opening and no data yet, fetch it
        if (!isOpen && !data && !isLoading) {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.post(endpoint, requestParams);
                setData(response.data);
            } catch (err) {
                console.error(`Failed to load ${title}:`, err);
                setError(err.response?.data?.detail || err.message || 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="border border-slate-800 rounded-2xl mb-4 overflow-hidden bg-slate-900/50 backdrop-blur-sm transition-all duration-300">
            {/* Header */}
            <button
                onClick={handleToggle}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-indigo-500/10' : 'hover:bg-slate-800/50'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center ${isOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                        <p className="text-sm text-slate-400 font-medium">
                            {isLoading ? 'Fetching data...' : data ? 'Analysis Ready' : description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isLoading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                    )}
                    {data && !isLoading && (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                            Cached
                        </span>
                    )}
                    <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </button>

            {/* Content */}
            <div
                className={`transition-all duration-700 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
            >
                <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                    {isLoading && !data && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                            </div>
                            <p className="text-slate-400 animate-pulse font-medium">Gathering financial data...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-4">
                            <div className="text-red-400 text-xl">⚠️</div>
                            <div className="flex-1">
                                <p className="text-red-200 font-medium">{error}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
                                >
                                    Retry Loading
                                </button>
                            </div>
                        </div>
                    )}

                    {data && !isLoading && children ? children(data) : null}
                </div>
            </div>
        </div>
    );
}

export default LazyAccordionSection;
