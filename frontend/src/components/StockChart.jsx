import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

function StockChart({ symbol, quote, ohlcData, indicators }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const legendRef = useRef(null)

  useEffect(() => {
    if (!chartContainerRef.current || !ohlcData?.data) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8', // slate-400
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#334155' }, // slate-700
        horzLines: { color: '#334155' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#475569',
      },
      rightPriceScale: {
        borderColor: '#475569',
      }
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981', // emerald-500
      downColor: '#f43f5e', // rose-500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
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

    const interval = ohlcData.interval || 'day'

    data.forEach(item => {
      // Handle different date formats based on interval
      let time
      const dateVal = item.date

      if (interval === 'hour') {
        // For hourly, use Unix timestamp
        if (dateVal instanceof Date) {
          time = Math.floor(dateVal.getTime() / 1000)
        } else if (typeof dateVal === 'string') {
          time = Math.floor(new Date(dateVal).getTime() / 1000)
        }
      } else {
        // For daily/weekly, use YYYY-MM-DD string to avoid timezone issues/gaps
        if (typeof dateVal === 'string') {
          // Assuming ISO string like "2023-01-01T..."
          time = dateVal.split('T')[0]
        } else if (dateVal instanceof Date) {
          time = dateVal.toISOString().split('T')[0]
        }
      }

      if (!time) return

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
      const color = close >= open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)' // emerald/rose with opacity

      volumeData.push({
        time: time,
        value: parseFloat(item.volume || item.Volume || 0),
        color: color
      })
    })

    const sortData = (a, b) => {
      if (typeof a.time === 'string' && typeof b.time === 'string') {
        return a.time.localeCompare(b.time)
      }
      return a.time - b.time
    }

    const cleanChartData = chartData.filter(item => item !== null && item.time).sort(sortData)
    const cleanVolumeData = volumeData.filter(item => item !== null && item.time).sort(sortData)

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
        color: '#3b82f6', // blue-500
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
        color: '#f59e0b', // amber-500
        lineWidth: 2,
        title: 'SMA 50',
      })
      sma50Series.setData(sma50Data)
    }

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove(param => {
      if (!legendRef.current) return;

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        legendRef.current.style.display = 'none';
        return;
      }

      legendRef.current.style.display = 'block';
      const ohlc = param.seriesData.get(candlestickSeries);

      if (ohlc) {
        const { open, high, low, close } = ohlc;
        const color = close >= open ? 'text-emerald-400' : 'text-rose-400';

        legendRef.current.innerHTML = `
          <div class="flex gap-4">
            <div>O: <span class="${color}">${open.toFixed(2)}</span></div>
            <div>H: <span class="${color}">${high.toFixed(2)}</span></div>
            <div>L: <span class="${color}">${low.toFixed(2)}</span></div>
            <div>C: <span class="${color}">${close.toFixed(2)}</span></div>
          </div>
        `;
      }
    });

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
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        Technical Analysis
      </h2>

      {/* Candlestick Chart with Legend */}
      <div className="mb-8 relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950" style={{ width: '100%', height: '400px' }}>
        <div ref={chartContainerRef} className="w-full h-full" />
        <div
          ref={legendRef}
          className="absolute top-3 left-3 z-[20] font-mono text-xs pointer-events-none p-2 rounded bg-slate-900/90 border border-slate-700 text-slate-300 shadow-xl"
          style={{ display: 'none' }}
        >
          {/* Content will be injected here */}
        </div>
      </div>

      {/* Indicators Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Moving Averages</h3>
          <div className="space-y-1 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">20-day SMA:</span>
              <span className="font-bold text-blue-400">₹{indicators.sma_20?.toFixed(2) || 'N/A'}</span>
            </div>
            {indicators.sma_50 && (
              <div className="flex justify-between">
                <span className="text-slate-500">50-day SMA:</span>
                <span className="font-bold text-amber-500">₹{indicators.sma_50.toFixed(2)}</span>
              </div>
            )}
            {indicators.sma_200 && (
              <div className="flex justify-between">
                <span className="text-slate-500">200-day SMA:</span>
                <span className="font-bold text-purple-400">₹{indicators.sma_200.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Price Levels</h3>
          <div className="space-y-3 text-sm font-mono">
            <div>
              <p className="text-slate-500 mb-1">Support Levels:</p>
              <p className="font-semibold text-emerald-500">
                {supportLevels.length > 0
                  ? supportLevels.map(level => `₹${level.toFixed(2)}`).join(', ')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Resistance Levels:</p>
              <p className="font-semibold text-rose-500">
                {resistanceLevels.length > 0
                  ? resistanceLevels.map(level => `₹${level.toFixed(2)}`).join(', ')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Trend Analysis</h3>
          <div className="space-y-1 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Price Trend:</span>
              <span className={`font-bold ${indicators.price_trend === 'bullish' ? 'text-emerald-400' :
                indicators.price_trend === 'bearish' ? 'text-rose-400' :
                  'text-slate-400'
                }`}>
                {indicators.price_trend?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volatility:</span>
              <span className="font-bold text-slate-200">{indicators.volatility?.toFixed(2) || 'N/A'}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Volume Analysis</h3>
          <div className="space-y-1 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Volume Trend:</span>
              <span className={`font-bold ${indicators.volume_analysis?.volume_trend === 'increasing' ? 'text-emerald-400' :
                indicators.volume_analysis?.volume_trend === 'decreasing' ? 'text-rose-400' :
                  'text-slate-400'
                }`}>
                {indicators.volume_analysis?.volume_trend?.toUpperCase() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg Volume:</span>
              <span className="font-bold text-slate-200">
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
