import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

function StockChart({ symbol, quote, ohlcData, indicators }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)

  useEffect(() => {
    if (!chartContainerRef.current || !ohlcData?.data) return

    // Create chart
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    candlestickSeriesRef.current = candlestickSeries

    // Setup price scale margins for candlestick (top 80%)
    candlestickSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1, // highest point of the series will be 10% away from the top
        bottom: 0.2, // lowest point will be 20% away from the bottom
      },
    });

    // Add Volume Series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });

    // Setup price scale margins for volume (bottom 20%)
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // highest point of the series will be 70% away from the top
        bottom: 0,
      },
    });

    // Prepare data
    const data = ohlcData.data || []
    const chartData = []
    const volumeData = []

    data.forEach(item => {
      // Handle different date formats
      let time
      const dateVal = item.date
      if (dateVal instanceof Date) {
        time = Math.floor(dateVal.getTime() / 1000) // Convert to Unix timestamp
      } else if (typeof dateVal === 'string') {
        time = Math.floor(new Date(dateVal).getTime() / 1000)
      } else {
        return
      }

      const open = parseFloat(item.open || item.Open || 0)
      const close = parseFloat(item.close || item.Close || 0)

      chartData.push({
        time: time,
        open: open,
        high: parseFloat(item.high || item.High || 0),
        low: parseFloat(item.low || item.Low || 0),
        close: close,
      })

      // Volume color based on price change
      const color = close >= open ? '#26a69a' : '#ef5350'

      volumeData.push({
        time: time,
        value: parseFloat(item.volume || item.Volume || 0),
        color: color
      })
    })

    const cleanChartData = chartData.filter(item => item !== null && item.time).sort((a, b) => a.time - b.time)
    const cleanVolumeData = volumeData.filter(item => item !== null && item.time).sort((a, b) => a.time - b.time)

    if (cleanChartData.length > 0) {
      candlestickSeries.setData(cleanChartData)
    }

    if (cleanVolumeData.length > 0) {
      volumeSeries.setData(cleanVolumeData)
    }

    // Calculate and add SMA lines
    if (cleanChartData.length >= 20 && indicators?.sma_20) {
      // Calculate 20-day SMA for each point
      const sma20Data = []
      for (let i = 19; i < cleanChartData.length; i++) {
        const periodData = cleanChartData.slice(i - 19, i + 1)
        const sma = periodData.reduce((sum, item) => sum + item.close, 0) / 20
        sma20Data.push({
          time: cleanChartData[i].time,
          value: sma,
        })
      }

      const sma20Series = chart.addLineSeries({
        color: '#10b981',
        lineWidth: 2,
        title: 'SMA 20',
      })
      sma20Series.setData(sma20Data)
    }

    if (cleanChartData.length >= 50 && indicators?.sma_50) {
      // Calculate 50-day SMA for each point
      const sma50Data = []
      for (let i = 49; i < cleanChartData.length; i++) {
        const periodData = cleanChartData.slice(i - 49, i + 1)
        const sma = periodData.reduce((sum, item) => sum + item.close, 0) / 50
        sma50Data.push({
          time: cleanChartData[i].time,
          value: sma,
        })
      }

      const sma50Series = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        title: 'SMA 50',
      })
      sma50Series.setData(sma50Data)
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [ohlcData, indicators])

  if (!indicators || !quote) return null

  const supportLevels = indicators.support_levels || []
  const resistanceLevels = indicators.resistance_levels || []

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Chart & Technical Indicators</h2>

      {/* Candlestick Chart */}
      <div className="mb-6" ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />

      {/* Indicators Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Moving Averages</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">20-day SMA:</span>
              <span className="font-semibold">₹{indicators.sma_20?.toFixed(2) || 'N/A'}</span>
            </div>
            {indicators.sma_50 && (
              <div className="flex justify-between">
                <span className="text-gray-600">50-day SMA:</span>
                <span className="font-semibold">₹{indicators.sma_50.toFixed(2)}</span>
              </div>
            )}
            {indicators.sma_200 && (
              <div className="flex justify-between">
                <span className="text-gray-600">200-day SMA:</span>
                <span className="font-semibold">₹{indicators.sma_200.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Price Levels</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Support Levels:</p>
              <p className="font-semibold text-green-600">
                {supportLevels.length > 0
                  ? supportLevels.map(level => `₹${level.toFixed(2)}`).join(', ')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Resistance Levels:</p>
              <p className="font-semibold text-red-600">
                {resistanceLevels.length > 0
                  ? resistanceLevels.map(level => `₹${level.toFixed(2)}`).join(', ')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Trend Analysis</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Price Trend:</span>
              <span className={`font-semibold ${indicators.price_trend === 'bullish' ? 'text-green-600' :
                  indicators.price_trend === 'bearish' ? 'text-red-600' :
                    'text-gray-600'
                }`}>
                {indicators.price_trend?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volatility:</span>
              <span className="font-semibold">{indicators.volatility?.toFixed(2) || 'N/A'}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Volume Analysis</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Volume Trend:</span>
              <span className={`font-semibold ${indicators.volume_analysis?.volume_trend === 'increasing' ? 'text-green-600' :
                  indicators.volume_analysis?.volume_trend === 'decreasing' ? 'text-red-600' :
                    'text-gray-600'
                }`}>
                {indicators.volume_analysis?.volume_trend?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Volume:</span>
              <span className="font-semibold">
                {indicators.volume_analysis?.average_volume?.toLocaleString('en-IN') || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockChart
