function StockInfo({ quote, symbol }) {
  if (!quote) return null

  const changePercent = quote.change_percent || 0
  const isPositive = changePercent >= 0

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{symbol}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Current Price</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{quote.last_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Change</p>
          <p className={`text-xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{quote.change?.toFixed(2) || '0.00'} 
            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">High</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{quote.high?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Low</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{quote.low?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Open</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{quote.open?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Close</p>
          <p className="text-lg font-semibold text-gray-900">
            ₹{quote.close?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-sm text-gray-600 mb-1">Volume</p>
          <p className="text-lg font-semibold text-gray-900">
            {quote.volume?.toLocaleString('en-IN') || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default StockInfo


