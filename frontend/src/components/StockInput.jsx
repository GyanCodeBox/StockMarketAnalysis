import { useState } from 'react'

function StockInput({ onAnalyze, loading }) {
  const [symbol, setSymbol] = useState('')
  const [exchange, setExchange] = useState('NSE')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (symbol.trim()) {
      onAnalyze(symbol.trim().toUpperCase(), exchange)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g., RELIANCE, TCS, INFY"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        
        <div className="md:w-32">
          <label htmlFor="exchange" className="block text-sm font-medium text-gray-700 mb-2">
            Exchange
          </label>
          <select
            id="exchange"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !symbol.trim()}
            className="w-full md:w-auto px-8 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StockInput


