import { useState } from 'react'
import StockInput from './components/StockInput'
import StockInfo from './components/StockInfo'
import StockChart from './components/StockChart'
import AIAnalysisDisplay from './components/AIAnalysisDisplay'
import './index.css'

function App() {
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyze = async (symbol, exchange) => {
    setLoading(true)
    setError(null)
    setAnalysisData(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, exchange }),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Agentic AI Stock Analysis
          </h1>
          <p className="text-gray-600">
            Intelligent stock analysis powered by LangGraph agents
          </p>
        </header>

        {/* Stock Input */}
        <div className="mb-8">
          <StockInput onAnalyze={handleAnalyze} loading={loading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {analysisData && (
          <div className="space-y-6">
            {/* Stock Info */}
            <StockInfo quote={analysisData.quote} symbol={analysisData.symbol} />

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


