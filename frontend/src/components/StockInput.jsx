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

    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 relative" ref={wrapperRef}>
      {/* Decorative gradient glow container */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 relative z-10">
        <div className="flex-1 relative">
          <label htmlFor="symbol" className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
            Stock Symbol
          </label>
          <div className="relative group">
            <input
              type="text"
              id="symbol"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => {
                if (symbol.trim().length >= 2) setShowSuggestions(true)
              }}
              placeholder="RELIANCE"
              className="w-full bg-slate-950/50 text-white px-4 py-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 font-mono text-lg uppercase"
              disabled={loading}
              autoComplete="off"
            />
            {/* Search Icon Overlay */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within:text-indigo-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-md">
              <ul className="divide-y divide-slate-800">
                {suggestions.map((item, index) => (
                  <li
                    key={`${item.exchange}-${item.symbol}-${index}`}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-4 py-3 hover:bg-slate-800/50 cursor-pointer flex justify-between items-center group transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-200 font-mono group-hover:text-indigo-400 transition-colors">{item.symbol}</span>
                      {item.name && (
                        <span className="ml-3 text-sm text-slate-500 truncate max-w-[200px] inline-block align-bottom group-hover:text-slate-400">
                          {item.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {item.exchange}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="md:w-40">
          <label htmlFor="exchange" className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
            Exchange
          </label>
          <select
            id="exchange"
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="w-full bg-slate-950/50 text-white px-4 py-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            disabled={loading}
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
          </select>
        </div>

        <div className="md:w-40">
          <label htmlFor="timeframe" className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
            Timeframe
          </label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-slate-950/50 text-white px-4 py-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
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
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-900/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : 'ANALYZE'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default StockInput


