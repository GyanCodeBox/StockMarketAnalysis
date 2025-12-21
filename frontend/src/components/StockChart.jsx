import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

function StockChart({ symbol, quote, ohlcData, indicators, isMaximized, onToggleMaximize }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const legendRef = useRef(null)

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

  useEffect(() => {
    if (!chartContainerRef.current || !ohlcData?.data) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8', // slate-400
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight, // Use container height
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

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    })

    candlestickSeriesRef.current = candlestickSeries

    candlestickSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.2 },
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const data = ohlcData.data || []
    const chartData = []
    const volumeData = []
    const interval = ohlcData.interval || 'day'

    data.forEach(item => {
      let time
      const dateVal = item.date
      if (interval === 'hour') {
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
    const cleanChartData = chartData.filter(item => item && item.time).sort(sortData)
    const cleanVolumeData = volumeData.filter(item => item && item.time).sort(sortData)

    if (cleanChartData.length > 0) candlestickSeries.setData(cleanChartData)
    if (cleanVolumeData.length > 0) volumeSeries.setData(cleanVolumeData)

    if (cleanChartData.length >= 20 && indicators?.sma_20) {
      const smaData = cleanChartData.slice(19).map((_, i) => ({
        time: cleanChartData[i + 19].time,
        value: cleanChartData.slice(i, i + 20).reduce((s, x) => s + x.close, 0) / 20
      }))
      const smaSeries = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, title: 'SMA 20' })
      smaSeries.setData(smaData)
    }

    if (cleanChartData.length >= 50 && indicators?.sma_50) {
      const smaData = cleanChartData.slice(49).map((_, i) => ({
        time: cleanChartData[i + 49].time,
        value: cleanChartData.slice(i, i + 50).reduce((s, x) => s + x.close, 0) / 50
      }))
      const smaSeries = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, title: 'SMA 50' })
      smaSeries.setData(smaData)
    }

    chart.subscribeCrosshairMove(param => {
      if (!legendRef.current) return;
      if (!param.point || !param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
        legendRef.current.style.display = 'none';
        return;
      }
      legendRef.current.style.display = 'block';
      const ohlc = param.seriesData.get(candlestickSeries);
      if (ohlc) {
        const color = ohlc.close >= ohlc.open ? 'text-emerald-400' : 'text-rose-400';
        legendRef.current.innerHTML = `<div class="flex gap-4">
            <div>O: <span class="${color}">${ohlc.open.toFixed(2)}</span></div>
            <div>H: <span class="${color}">${ohlc.high.toFixed(2)}</span></div>
            <div>L: <span class="${color}">${ohlc.low.toFixed(2)}</span></div>
            <div>C: <span class="${color}">${ohlc.close.toFixed(2)}</span></div>
          </div>`;
      }
    });

    // Use ResizeObserver for perfect fit
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.resize(width, height);
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) chartRef.current.remove()
    }
  }, [ohlcData, indicators, isMaximized]) // Dependency on isMaximized for re-mount in different layout

  if (!indicators || !quote) return null

  const supportLevels = indicators.support_levels || []
  const resistanceLevels = indicators.resistance_levels || []

  return (
    <div className={`transition-all duration-300 ${isMaximized
      ? 'fixed inset-0 z-[110] bg-slate-950 flex flex-col p-4 md:p-6'
      : 'bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl p-6 backdrop-blur-sm'
      }`}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Technical {isMaximized ? `Analysis - ${symbol}` : 'Analysis'}
        </h2>

        <div className="flex items-center gap-3">
          {isMaximized && (
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> SMA 20: ₹{indicators.sma_20?.toFixed(2)}</div>
              {indicators.sma_50 && <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> SMA 50: ₹{indicators.sma_50?.toFixed(2)}</div>}
            </div>
          )}
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
        className={`relative border border-slate-800 rounded-lg overflow-hidden bg-slate-950 transition-all duration-300 ${isMaximized ? 'flex-1' : 'mb-8 h-[400px]'}`}
      >
        <div ref={chartContainerRef} className="w-full h-full" />
        <div
          ref={legendRef}
          className="absolute top-3 left-3 z-[20] font-mono text-sm pointer-events-none p-2 rounded bg-slate-900/90 border border-slate-700 text-slate-300 shadow-xl"
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
