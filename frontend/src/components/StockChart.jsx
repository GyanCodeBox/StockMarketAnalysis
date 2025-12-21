import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import ChartSettings, { TIMEFRAME_DEFAULTS } from './ChartSettings'
import QuickMAToggles from './QuickMAToggles'
import { Calendar, Clock, Loader2 } from 'lucide-react'

function StockChart({ symbol, quote, ohlcData, indicators, isMaximized, onToggleMaximize, onTimeframeChange, loading }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const legendRef = useRef(null)
  const maSeriesRefs = useRef({})

  const [maConfig, setMAConfig] = useState([])

  // Load initial MA config from local storage or use defaults
  useEffect(() => {
    const timeframe = ohlcData?.interval || 'day'
    const savedPrefs = localStorage.getItem(`chart_prefs_${symbol}_${timeframe}`)
    if (savedPrefs) {
      try {
        setMAConfig(JSON.parse(savedPrefs))
      } catch (e) {
        setMAConfig(TIMEFRAME_DEFAULTS[timeframe] || TIMEFRAME_DEFAULTS['day'])
      }
    } else {
      setMAConfig(TIMEFRAME_DEFAULTS[timeframe] || TIMEFRAME_DEFAULTS['day'])
    }
  }, [symbol, ohlcData?.interval])

  const handleToggleMA = useCallback((index) => {
    const updated = [...maConfig]
    updated[index].enabled = !updated[index].enabled
    setMAConfig(updated)
    // Save to local storage
    const timeframe = ohlcData?.interval || 'day'
    localStorage.setItem(`chart_prefs_${symbol}_${timeframe}`, JSON.stringify(updated))
  }, [maConfig, symbol, ohlcData?.interval])

  // Handle body scroll lock
  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMaximized])

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      grid: {
        vertLines: { color: '#334155' },
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

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    // Save volume series in a ref too
    chart.volumeSeries = volumeSeries

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartRef.current) return
      const { width, height } = entries[0].contentRect
      chartRef.current.resize(width, height)
    })
    resizeObserver.observe(chartContainerRef.current)

    // Chart Crosshair Move
    chart.subscribeCrosshairMove(param => {
      if (!legendRef.current) return
      if (!param.point || !param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
        legendRef.current.style.display = 'none'
        return
      }
      legendRef.current.style.display = 'block'
      const ohlc = param.seriesData.get(candlestickSeries)
      if (ohlc) {
        const color = ohlc.close >= ohlc.open ? 'text-emerald-400' : 'text-rose-400'
        legendRef.current.innerHTML = `<div class="flex gap-4">
            <div>O: <span class="${color}">${ohlc.open.toFixed(2)}</span></div>
            <div>H: <span class="${color}">${ohlc.high.toFixed(2)}</span></div>
            <div>L: <span class="${color}">${ohlc.low.toFixed(2)}</span></div>
            <div>C: <span class="${color}">${ohlc.close.toFixed(2)}</span></div>
          </div>`
      }
    })

    return () => {
      resizeObserver.disconnect()
      if (chartRef.current) chartRef.current.remove()
      chartRef.current = null
    }
  }, []) // Only create once

  // Update Data and Indicators
  useEffect(() => {
    if (!chartRef.current || !ohlcData?.data) return

    const candlestickSeries = candlestickSeriesRef.current
    const volumeSeries = chartRef.current.volumeSeries

    const data = ohlcData.data || []
    const chartData = []
    const volumeData = []
    const interval = ohlcData.interval || 'day'

    data.forEach(item => {
      let time
      const dateVal = item.date
      if (interval === 'hour' || interval === '15minute' || interval === '5minute') {
        time = dateVal instanceof Date ? Math.floor(dateVal.getTime() / 1000) : Math.floor(new Date(dateVal).getTime() / 1000)
      } else {
        time = typeof dateVal === 'string' ? dateVal.split('T')[0] : dateVal.toISOString().split('T')[0]
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

      const color = close >= open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)'
      volumeData.push({
        time: time,
        value: parseFloat(item.volume || item.Volume || 0),
        color: color
      })
    })

    const sortData = (a, b) => (typeof a.time === 'string' ? a.time.localeCompare(b.time) : a.time - b.time)

    // Deduplicate
    const uniqueChartData = Array.from(
      chartData.reduce((map, item) => map.set(item.time, item), new Map()).values()
    ).sort(sortData);

    const uniqueVolumeData = Array.from(
      volumeData.reduce((map, item) => map.set(item.time, item), new Map()).values()
    ).sort(sortData);

    if (uniqueChartData.length > 0) candlestickSeries.setData(uniqueChartData)
    if (uniqueVolumeData.length > 0) volumeSeries.setData(uniqueVolumeData)

    // Fit content on data change
    chartRef.current.timeScale().fitContent()

    // Render Moving Averages
    // Clear old MA series
    Object.values(maSeriesRefs.current).forEach(s => chartRef.current.removeSeries(s))
    maSeriesRefs.current = {}

    if (indicators?.moving_averages) {
      maConfig.forEach(ma => {
        if (!ma.enabled) return

        const key = `${ma.type.toUpperCase()}_${ma.period}`
        const maData = indicators.moving_averages[key]

        if (maData && maData.length === ohlcData.data.length) {
          const formattedMaData = maData.map((val, idx) => ({
            time: uniqueChartData[idx]?.time,
            value: val
          })).filter(d => d && d.value !== null && d.time)

          if (formattedMaData.length > 0) {
            const series = chartRef.current.addLineSeries({
              color: ma.color,
              lineWidth: ma.width,
              priceLineVisible: false,
              lastValueVisible: false,
              title: `${ma.period} ${ma.type}`
            })
            series.setData(formattedMaData)
            maSeriesRefs.current[key] = series
          }
        }
      })
    }
  }, [ohlcData, indicators, maConfig]) // Re-run when data or config changes

  if (!indicators || !quote) return null

  const supportLevels = indicators.support_levels || []
  const resistanceLevels = indicators.resistance_levels || []

  return (
    <div className={`transition-all duration-300 ${isMaximized
      ? 'fixed inset-0 z-[110] bg-slate-950 flex flex-col p-4 md:p-6'
      : 'bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl p-6 backdrop-blur-sm'
      }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Technical {isMaximized ? `Analysis - ${symbol}` : 'Analysis'}
            {loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
          </h2>
          {/* We need to pass 'loading' prop from App.jsx to StockChart */}
          <QuickMAToggles
            movingAverages={maConfig}
            onToggle={handleToggleMA}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="pl-3 py-1.5 text-slate-500">
              {['day', 'week'].includes(ohlcData.interval) ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <select
              value={ohlcData.interval || 'day'}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="bg-transparent text-slate-200 text-sm font-medium pl-2 pr-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="hour">Hourly</option>
              <option value="15minute">15m</option>
              <option value="5minute">5m</option>
            </select>
          </div>

          <ChartSettings
            symbol={symbol}
            timeframe={ohlcData.interval || 'day'}
            onConfigChange={setMAConfig}
          />

          <button
            onClick={onToggleMaximize}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 shadow-lg"
            title={isMaximized ? "Minimize (Esc)" : "Maximize"}
          >
            {isMaximized ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Candlestick Chart with Legend */}
      <div
        className={`relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 transition-all duration-300 ${isMaximized ? 'flex-1' : 'mb-8 h-[450px]'}`}
      >
        <div ref={chartContainerRef} className="w-full h-full" />
        <div
          ref={legendRef}
          className="absolute top-3 left-3 z-[20] font-mono text-xs pointer-events-none p-2 rounded bg-slate-900/90 border border-slate-700 text-slate-300 shadow-xl"
          style={{ display: 'none' }}
        >
          {/* Content will be injected here */}
        </div>
      </div>

      {/* Indicators Summary - Hidden in Maximized mode for a cleaner view */}
      {!isMaximized && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Moving Averages</h3>
            <div className="space-y-1 text-sm font-mono">
              {maConfig.filter(ma => ma.enabled).slice(0, 3).map((ma, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-slate-500">{ma.period} {ma.type}:</span>
                  <span className="font-bold" style={{ color: ma.color }}>
                    ₹{indicators.moving_averages[`${ma.type.toUpperCase()}_${ma.period}`]?.slice(-1)[0]?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              ))}
              {maConfig.filter(ma => ma.enabled).length === 0 && <span className="text-slate-600 text-xs italic">No MAs enabled</span>}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Price Levels</h3>
            <div className="space-y-3 text-sm font-mono">
              <div>
                <p className="text-slate-500 mb-1">Support:</p>
                <p className="font-semibold text-emerald-500">{supportLevels.join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Resistance:</p>
                <p className="font-semibold text-rose-500">{resistanceLevels.join(', ') || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Trend</h3>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Price:</span>
                <span className={`font-bold ${indicators.price_trend === 'bullish' ? 'text-emerald-400' : indicators.price_trend === 'bearish' ? 'text-rose-400' : 'text-slate-400'}`}>
                  {indicators.price_trend?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volatility:</span>
                <span className="font-bold text-slate-200">{indicators.volatility?.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
            <h3 className="font-semibold text-slate-300 mb-3 text-sm uppercase tracking-wider">Volume</h3>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Trend:</span>
                <span className={`font-bold ${indicators.volume_analysis?.volume_trend === 'increasing' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {indicators.volume_analysis?.volume_trend?.toUpperCase() || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg:</span>
                <span className="font-bold text-slate-200">{indicators.volume_analysis?.average_volume?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockChart
