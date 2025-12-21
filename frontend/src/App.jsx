import { useState, useEffect } from 'react'
import StockInput from './components/StockInput'
import StockInfo from './components/StockInfo'
import StockChart from './components/StockChart'
import AIAnalysisDisplay from './components/AIAnalysisDisplay'
import FundamentalAnalysis from './components/FundamentalAnalysis'
import LoadingAnimation from './components/LoadingAnimation'
import TechnicalScoreCard from './components/TechnicalScoreCard'
import LazyAccordionSection from './components/LazyAccordionSection'
import ScrollNavigation from './components/ScrollNavigation'
import { TIMEFRAME_DEFAULTS } from './components/ChartSettings'
import './index.css'

function App() {
  const [techData, setTechData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [symbol, setSymbol] = useState('')
  const [exchange, setExchange] = useState('NSE')
  const [activeTab, setActiveTab] = useState('technical')
  const [isChartMaximized, setIsChartMaximized] = useState(false)

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isChartMaximized) {
        setIsChartMaximized(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isChartMaximized])

  const handleAnalyze = async (symbolValue, exchangeValue, timeframe = 'day') => {
    const isJustTimeframe = symbolValue === symbol && exchangeValue === exchange && techData;

    setLoading(true)
    setError(null)

    // Only clear data if it's a new stock, to prevent "flash" and full page reload feel
    if (!isJustTimeframe) {
      setTechData(null)
      setSymbol(symbolValue)
      setExchange(exchangeValue)
      setIsChartMaximized(false)
    }

    // Load saved MA config for this symbol/timeframe if it exists
    let moving_averages = null;
    const savedPrefs = localStorage.getItem(`chart_prefs_${symbolValue}_${timeframe} `);
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        // Only send necessary fields to backend
        moving_averages = prefs.map(ma => ({ type: ma.type, period: ma.period }));
      } catch (e) {
        console.warn("Failed to parse saved chart prefs", e);
      }
    } else {
      // Use defaults for this timeframe
      const defaults = TIMEFRAME_DEFAULTS[timeframe] || TIMEFRAME_DEFAULTS['day'];
      moving_averages = defaults.filter(ma => ma.enabled).map(ma => ({ type: ma.type, period: ma.period }));
    }

    const payload = {
      symbol: symbolValue,
      exchange: exchangeValue,
      timeframe,
      moving_averages
    };

    // Progressive requests
    const fetchTech = async () => {
      try {
        const res = await fetch('/api/analyze/technical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setTechData(data);
        } else {
          setError("Failed to fetch technical data");
        }
      } catch (e) {
        console.error("Tech fetch error", e);
        setError("Failed to connect to server");
      }
    };



    // Only fetch Technical data initially for instant feedback
    fetchTech();

    Promise.all([fetchTech()]).finally(() => {
      setLoading(false);
    });
  }

  return (
    <div id="terminal-top" className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      <div className={isChartMaximized ? "" : "max-w-7xl mx-auto px-4 py-8"}>
        {/* Header */}
        {!isChartMaximized && (
          <header className="mb-10 text-center relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-indigo-500/20 rounded-full blur-[80px] -z-10"></div>
            <h1 className="text-5xl font-black mb-2 tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 text-transparent bg-clip-text">
              TERMINAL<span className="text-slate-500">.AI</span>
            </h1>
            <p className="text-slate-400 text-lg font-light tracking-wide">
              Professional Grade Agentic Stock Analysis
            </p>
          </header>
        )}

        {/* Stock Input */}
        {!isChartMaximized && (
          <div className="mb-8">
            <StockInput onAnalyze={handleAnalyze} loading={loading} />
          </div>
        )}


        {/* Loading Animation */}
        {loading && symbol && !techData && (
          <LoadingAnimation symbol={symbol} />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-sm">
            <p className="font-semibold text-red-400">Analysis Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}


        {/* Results */}
        {techData && (
          <div className="space-y-6">
            {/* Stock Info */}
            {!isChartMaximized && (
              <StockInfo quote={techData.quote} symbol={techData.symbol} />
            )}

            {/* Tab Navigation */}
            {!isChartMaximized && (
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`px - 4 py - 2 rounded - lg font - medium transition - all ${activeTab === 'technical'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    } `}
                >
                  Technical Analysis
                </button>
                <button
                  onClick={() => setActiveTab('fundamental')}
                  className={`px - 4 py - 2 rounded - lg font - medium transition - all ${activeTab === 'fundamental'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    } `}
                >
                  Fundamental Analysis
                </button>
              </div>
            )}

            {/* Content Views */}
            {activeTab === 'technical' ? (
              <div id="technical-section" className={`space - y - 6 ${isChartMaximized ? "" : "animate-fade-in"} `}>
                {/* Technical Score Card */}
                {techData.indicators?.technical_score && (
                  <TechnicalScoreCard scoreData={techData.indicators.technical_score} />
                )}

                {/* Chart Section */}
                {!isChartMaximized && (
                  <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-2xl overflow-hidden">
                    <StockChart
                      symbol={techData.symbol}
                      quote={techData.quote}
                      ohlcData={techData.ohlc_data}
                      indicators={techData.indicators}
                      isMaximized={isChartMaximized}
                      onToggleMaximize={() => setIsChartMaximized(!isChartMaximized)}
                      onTimeframeChange={(newTf) => handleAnalyze(symbol, exchange, newTf)}
                      loading={loading}
                    />
                  </div>
                )}

                {/* Lazy AI Market Intelligence */}
                <div id="ai-section" className="mt-8 pt-4 border-t border-slate-800/50">
                  <LazyAccordionSection
                    title="AI Market Intelligence"
                    icon="🚀"
                    description="Deep multi-agent research and technical synthesis"
                    endpoint="/api/analyze/summary"
                    requestParams={{ symbol, exchange, timeframe: 'day' }}
                  >
                    {(data) => <AIAnalysisDisplay analysis={data.analysis} />}
                  </LazyAccordionSection>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <FundamentalAnalysis symbol={symbol} exchange={exchange} />

                {/* Restore AI Market Intelligence to Fundamental tab as well */}
                <div className="mt-8 pt-4 border-t border-slate-800/50">
                  <LazyAccordionSection
                    title="AI Market Intelligence"
                    icon="🚀"
                    description="Deep multi-agent research and technical synthesis"
                    endpoint="/api/analyze/summary"
                    requestParams={{ symbol, exchange, timeframe: 'day' }}
                  >
                    {(data) => <AIAnalysisDisplay analysis={data.analysis} />}
                  </LazyAccordionSection>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {!isChartMaximized && <ScrollNavigation />}
    </div>
  )
}

export default App
