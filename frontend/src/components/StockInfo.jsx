function StockInfo({ quote, symbol }) {
  if (!quote) return null

  const changePercent = quote.change_percent || 0
  const isPositive = changePercent >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Main Price Card */}
      <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex items-center justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-1">{symbol}</h2>
          <p className="text-slate-400 text-sm font-mono tracking-wider">MARKET PRICE</p>
        </div>
        <div className="text-right z-10">
          <p className="text-4xl font-mono font-bold text-white tracking-tighter">
            ₹{quote.last_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-lg font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end gap-1`}>
            {isPositive ? '▲' : '▼'} {Math.abs(quote.change || 0).toFixed(2)} ({changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        {/* High/Low */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs text-slate-500 font-mono uppercase">High</span>
            <span className="text-lg font-mono font-semibold text-slate-200">₹{quote.high?.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500/50 h-full rounded-full" style={{ width: '70%' }}></div>
          </div>
          <div className="flex justify-between items-end mt-2">
            <span className="text-xs text-slate-500 font-mono uppercase">Low</span>
            <span className="text-lg font-mono font-semibold text-slate-200">₹{quote.low?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Open/Close/Vol */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 font-mono uppercase">Open</span>
            <span className="font-mono text-slate-300">₹{quote.open?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500 font-mono uppercase">Prev Close</span>
            <span className="font-mono text-slate-300">₹{quote.close?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 mt-1">
            <span className="text-xs text-slate-500 font-mono uppercase">Volume</span>
            <span className="font-mono text-indigo-300 font-semibold">{quote.volume?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockInfo


