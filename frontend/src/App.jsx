import { useState } from 'react'
import StockInput from './components/StockInput'
import StockInfo from './components/StockInfo'
import StockChart from './components/StockChart'
import AIAnalysisDisplay from './components/AIAnalysisDisplay'
import FundamentalAnalysis from './components/FundamentalAnalysis'
import LoadingAnimation from './components/LoadingAnimation'
import './index.css'

function App() {
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [symbol, setSymbol] = useState('') // Track current symbol
  const [activeTab, setActiveTab] = useState('technical') // 'technical' or 'fundamental'

  const handleAnalyze = async (symbolValue, exchange, timeframe = 'day') => {
    setLoading(true)
    setError(null)
    setAnalysisData(null)
    setSymbol(symbolValue) // Store the symbol being analyzed

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: symbolValue, exchange, timeframe }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to analyze stock')
      }

      const data = await response.json()
      setAnalysisData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-10 text-center relative z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-indigo-500/20 rounded-full blur-[80px] -z-10"></div>
          <h1 className="text-5xl font-black mb-2 tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 text-transparent bg-clip-text">
            TERMINAL<span className="text-slate-500">.AI</span>
          </h1>
          <p className="text-slate-400 text-lg font-light tracking-wide">
            Professional Grade Agentic Stock Analysis
          </p>
        </header>

        {/* Stock Input */}
        <div className="mb-8">
          <StockInput onAnalyze={handleAnalyze} loading={loading} />
        </div>


        {/* Loading Animation */}
        {loading && symbol && (
          <LoadingAnimation symbol={symbol} />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}


        {/* Results */}
        {analysisData && !loading && (
          <div className="space-y-6">
            {/* Stock Info */}
            <StockInfo quote={analysisData.quote} symbol={analysisData.symbol} />

            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('technical')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'technical'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                Technical Analysis
              </button>
              <button
                onClick={() => setActiveTab('fundamental')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'fundamental'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
              >
                Fundamental Analysis
              </button>
            </div>

            {/* Content Views */}
            {activeTab === 'technical' ? (
              <div className="space-y-6 animate-fade-in-up">
                {/* Chart */}
                {analysisData.indicators && (
                  <StockChart
                    symbol={analysisData.symbol}
                    quote={analysisData.quote}
                    ohlcData={analysisData.ohlc_data}
                    indicators={analysisData.indicators}
                  />
                )}

                {/* AI Analysis */}
                {analysisData.analysis && (
                  <AIAnalysisDisplay analysis={analysisData.analysis} />
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                <FundamentalAnalysis data={analysisData.fundamental_data} />

                {/* Also show AI Analysis in Fundamental view if relevant, or keep it shared? 
                     The AI Analysis is "Combined", so it fits both. Let's show it here too or move out of tabs.
                     For now, I'll show it in both or just let FundamentalAnalysis handle its own view. 
                     Fundamental component is rich enough. I will add AI Analysis at bottom of Fundamental too if requested.
                     But let's stick to just the component I built.
                  */}
                {analysisData.analysis && (
                  <AIAnalysisDisplay analysis={analysisData.analysis} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Analyzing stock data...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App


