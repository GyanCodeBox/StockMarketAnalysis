import { useState, useEffect, useRef } from 'react'
// Looking at the code, I don't see any icons imported. I'll stick to basic styling.

function StockInput({ onAnalyze, loading }) {
  const [symbol, setSymbol] = useState('')
  const [exchange, setExchange] = useState('NSE')
  const [timeframe, setTimeframe] = useState('day')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef(null)

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [wrapperRef])

  // Fetch suggestions with debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!symbol.trim() || symbol.trim().length < 2) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: symbol, exchange }),
        })

        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.results || [])
          setShowSuggestions(true)
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
      }
    }

    const timeoutId = setTimeout(() => {
      if (symbol.trim()) {
        fetchSuggestions()
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [symbol, exchange])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (symbol.trim()) {
      onAnalyze(symbol.trim().toUpperCase(), exchange, timeframe)
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setSymbol(suggestion.symbol)
    setExchange(suggestion.exchange)
    // Keep current timeframe
    onAnalyze(suggestion.symbol, suggestion.exchange, timeframe)
    setShowSuggestions(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 relative">
        <div className="flex-1 relative">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value)
              setShowSuggestions(true) // Show suggestions again when typing
            }}
            onFocus={() => {
              if (symbol.trim().length >= 2) setShowSuggestions(true)
            }}
            placeholder="e.g., RELIANCE, TCS, INFY"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
            autoComplete="off"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <ul>
                {suggestions.map((item, index) => (
                  <li
                    key={`${item.exchange}-${item.symbol}-${index}`}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center bg-white"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{item.symbol}</span>
                      {item.name && (
                        <span className="ml-2 text-sm text-gray-500 truncate max-w-[200px] inline-block align-bottom">
                          {item.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {item.exchange}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

        <div className="md:w-32">
          <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-2">
            Timeframe
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="hour">Hourly</option>
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


