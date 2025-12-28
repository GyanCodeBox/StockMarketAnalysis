import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import ChartSettings, { TIMEFRAME_DEFAULTS } from './ChartSettings'
import QuickMAToggles from './QuickMAToggles'
import StructureDetailPanel from './StructureDetailPanel'
import { Calendar, Clock, Loader2 } from 'lucide-react'

function StockChart({ symbol, quote, ohlcData, indicators, accumulationZones = [], distributionZones = [], failedBreakouts = [], isMaximized, onToggleMaximize, onTimeframeChange, loading, onRefresh, selectedStructure, onSelectStructure }) {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candlestickSeriesRef = useRef(null)
  const legendRef = useRef(null)
  const maSeriesRefs = useRef({})
  const volumeLookupRef = useRef(new Map())
  const lastHoverCandleRef = useRef(null)
  const explainedCandleTimeRef = useRef(null)

  const [maConfig, setMAConfig] = useState([])
  const [explainState, setExplainState] = useState({
    loading: false,
    data: null,
    error: null,
  })
  const [showExplain, setShowExplain] = useState(false)
  const [showZones, setShowZones] = useState(true)
  const [zoneOverlays, setZoneOverlays] = useState([])
  const [hoverStructure, setHoverStructure] = useState(null)
  const [showFailedBreakouts, setShowFailedBreakouts] = useState(true)
  const [failedMarkers, setFailedMarkers] = useState([])
  const [hoverFailure, setHoverFailure] = useState(null)
  const [selectedFailure, setSelectedFailure] = useState(null)

  // Load initial MA config from local storage or use defaults
  useEffect(() => {
    const timeframe = ohlcData?.interval || 'day'
    const savedPrefs = localStorage.getItem(`chart_prefs_${symbol}_${timeframe}`)
    const savedZonePref = localStorage.getItem(`accum_zones_${symbol}_${timeframe}`)
    const savedFailedPref = localStorage.getItem(`failed_breakouts_${symbol}_${timeframe}`)
    if (savedZonePref !== null) {
      setShowZones(savedZonePref === 'true')
    } else {
      setShowZones(true)
    }
    if (savedFailedPref !== null) {
      setShowFailedBreakouts(savedFailedPref === 'true')
    } else {
      setShowFailedBreakouts(true)
    }
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

  const handleToggleZones = useCallback(() => {
    const timeframe = ohlcData?.interval || 'day'
    const next = !showZones
    setShowZones(next)
    localStorage.setItem(`accum_zones_${symbol}_${timeframe}`, String(next))
    if (!next) {
      setZoneOverlays([])
      onSelectStructure(null)
    }
  }, [ohlcData?.interval, showZones, symbol])

  const handleToggleFailedBreakouts = useCallback(() => {
    const timeframe = ohlcData?.interval || 'day'
    const next = !showFailedBreakouts
    setShowFailedBreakouts(next)
    localStorage.setItem(`failed_breakouts_${symbol}_${timeframe}`, String(next))
    if (!next) {
      setFailedMarkers([])
      setSelectedFailure(null)
      setHoverFailure(null)
    }
  }, [ohlcData?.interval, showFailedBreakouts, symbol])

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

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const range = timeScale.getVisibleLogicalRange();
      if (range) {
        const delta = (range.to - range.from) * 0.2; // Zoom in by 20%
        timeScale.setVisibleLogicalRange({
          from: range.from + delta / 2,
          to: range.to - delta / 2
        });
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const range = timeScale.getVisibleLogicalRange();
      if (range) {
        const delta = (range.to - range.from) * 0.25; // Zoom out by 25%
        timeScale.setVisibleLogicalRange({
          from: Math.max(0, range.from - delta / 2),
          to: range.to + delta / 2
        });
      }
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().resetTimeScale();
    }
  }, []);

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

        // Store last hover candle for explain-on-right-click
        const vol = volumeLookupRef.current.get(ohlc.time)
        lastHoverCandleRef.current = {
          ...ohlc,
          volume: vol,
        }
      }
    })

    return () => {
      resizeObserver.disconnect()
      if (chartRef.current) chartRef.current.remove()
      chartRef.current = null
    }
  }, []) // Only create once

  const computeZoneOverlays = useCallback(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !showZones) {
      setZoneOverlays([])
      return
    }
    const timeScale = chartRef.current.timeScale()
    const priceScale = candlestickSeriesRef.current.priceScale()
    if (!timeScale || !priceScale || typeof candlestickSeriesRef.current.priceToCoordinate !== 'function') {
      setZoneOverlays([])
      return
    }
    const normalizeZoneTime = (val) => {
      const intraday = (ohlcData?.interval === 'hour' || ohlcData?.interval === '15minute' || ohlcData?.interval === '5minute')
      if (!val) return null
      if (intraday) {
        const d = val instanceof Date ? val : new Date(val)
        if (isNaN(d)) return null
        return Math.floor(d.getTime() / 1000)
      }
      if (typeof val === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
        const parsed = new Date(val)
        if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
        if (val.includes('T')) return val.split('T')[0]
        return null
      }
      if (val instanceof Date) return val.toISOString().slice(0, 10)
      return null
    }

    const overlays = [];

    // 1. Process Accumulation Zones
    (accumulationZones || []).forEach((zone) => {
      const start = normalizeZoneTime(zone.start_time)
      const end = normalizeZoneTime(zone.end_time)
      if (!start || !end) return
      const x1 = timeScale.timeToCoordinate(start)
      const x2 = timeScale.timeToCoordinate(end)
      const yHigh = candlestickSeriesRef.current.priceToCoordinate(zone.zone_high || zone.metrics?.high)
      const yLow = candlestickSeriesRef.current.priceToCoordinate(zone.zone_low || zone.metrics?.low)
      if (x1 == null || x2 == null || yHigh == null || yLow == null) return
      const left = Math.min(x1, x2)
      const width = Math.abs(x2 - x1)
      const top = Math.min(yHigh, yLow)
      const height = Math.abs(yLow - yHigh)
      overlays.push({
        id: `accum-${zone.start_time}-${zone.end_time}`,
        left, width, top, height,
        zone,
        type: 'ACCUMULATION'
      })
    });

    // 2. Process Distribution Zones
    (distributionZones || []).forEach((zone) => {
      const start = normalizeZoneTime(zone.start_time)
      const end = normalizeZoneTime(zone.end_time)
      if (!start || !end) return
      const x1 = timeScale.timeToCoordinate(start)
      const x2 = timeScale.timeToCoordinate(end)
      const yHigh = candlestickSeriesRef.current.priceToCoordinate(zone.zone_high || zone.metrics?.high || (zone.metrics?.zone_high)) // Fallback to metrics if available
      const yLow = candlestickSeriesRef.current.priceToCoordinate(zone.zone_low || zone.metrics?.low || (zone.metrics?.zone_low))

      // If zone properties aren't directly available, use metrics
      const hi = zone.zone_high || (zone.metrics && (zone.metrics.high || zone.metrics.zone_high))
      const lo = zone.zone_low || (zone.metrics && (zone.metrics.low || zone.metrics.zone_low))

      const yCoordHigh = candlestickSeriesRef.current.priceToCoordinate(hi)
      const yCoordLow = candlestickSeriesRef.current.priceToCoordinate(lo)

      if (x1 == null || x2 == null || yCoordHigh == null || yCoordLow == null) return

      const left = Math.min(x1, x2)
      const width = Math.abs(x2 - x1)
      const top = Math.min(yCoordHigh, yCoordLow)
      const height = Math.abs(yCoordLow - yCoordHigh)

      overlays.push({
        id: `dist-${zone.start_time}-${zone.end_time}`,
        left, width, top, height,
        zone,
        type: 'DISTRIBUTION'
      })
    });

    setZoneOverlays(overlays)
  }, [accumulationZones, distributionZones, showZones])

  useEffect(() => {
    computeZoneOverlays()
  }, [computeZoneOverlays, accumulationZones, distributionZones])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const handler = () => computeZoneOverlays()
    const timeScale = chart.timeScale()
    timeScale.subscribeVisibleTimeRangeChange(handler)
    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(handler)
    }
  }, [computeZoneOverlays])

  const computeFailedMarkers = useCallback(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !showFailedBreakouts || !failedBreakouts?.length) {
      setFailedMarkers([])
      return
    }
    const timeScale = chartRef.current.timeScale()
    const priceToY = (price) => candlestickSeriesRef.current.priceToCoordinate(price)
    const normalizeTime = (val) => {
      const intraday = (ohlcData?.interval === 'hour' || ohlcData?.interval === '15minute' || ohlcData?.interval === '5minute')
      if (!val) return null
      if (intraday) {
        const d = val instanceof Date ? val : new Date(val)
        if (isNaN(d)) return null
        return Math.floor(d.getTime() / 1000)
      }
      if (typeof val === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
        const parsed = new Date(val)
        if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
        if (val.includes('T')) return val.split('T')[0]
        return null
      }
      if (val instanceof Date) return val.toISOString().slice(0, 10)
      return null
    }
    const markers = []
    failedBreakouts.forEach((fb, idx) => {
      const t = normalizeTime(fb.failure_time || fb.breakout_time)
      if (!t) return
      const x = timeScale.timeToCoordinate(t)
      const y = priceToY(fb.breakout_level)
      if (x == null || y == null) return
      markers.push({
        id: `${idx}-${t}`,
        x,
        y,
        event: fb,
      })
    })
    setFailedMarkers(markers)
  }, [failedBreakouts, showFailedBreakouts, ohlcData?.interval])

  useEffect(() => {
    computeFailedMarkers()
  }, [computeFailedMarkers, failedBreakouts])

  // Update Data and Indicators
  useEffect(() => {
    if (!chartRef.current || !ohlcData?.data) return

    const candlestickSeries = candlestickSeriesRef.current
    const volumeSeries = chartRef.current.volumeSeries

    const data = ohlcData.data || []
    const chartData = []
    const volumeData = []
    const interval = ohlcData.interval || 'day'
    const nextVolumeLookup = new Map()

    const normalizeTime = (dateVal) => {
      if (!dateVal) return null
      const intraday = interval === 'hour' || interval === '15minute' || interval === '5minute'
      if (intraday) {
        const d = dateVal instanceof Date ? dateVal : new Date(dateVal)
        if (isNaN(d)) return null
        return Math.floor(d.getTime() / 1000)
      }
      if (typeof dateVal === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal
        const parsed = new Date(dateVal)
        if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10)
        if (dateVal.includes('T')) return dateVal.split('T')[0]
        return null
      }
      if (dateVal instanceof Date) {
        return dateVal.toISOString().slice(0, 10)
      }
      return null
    }

    data.forEach(item => {
      const dateVal = item.date || item.time || item.timestamp
      const time = normalizeTime(dateVal)
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

      nextVolumeLookup.set(time, parseFloat(item.volume || item.Volume || 0))
    })

    const sortData = (a, b) => (typeof a.time === 'string' ? a.time.localeCompare(b.time) : a.time - b.time)

    // Deduplicate and filter out any items with NaN or invalid values
    const uniqueChartData = Array.from(
      chartData.reduce((map, item) => map.set(item.time, item), new Map()).values()
    ).filter(d =>
      d.time &&
      Number.isFinite(d.open) &&
      Number.isFinite(d.high) &&
      Number.isFinite(d.low) &&
      Number.isFinite(d.close)
    ).sort(sortData);

    const uniqueVolumeData = Array.from(
      volumeData.reduce((map, item) => map.set(item.time, item), new Map()).values()
    ).filter(d => d.time && Number.isFinite(d.value)).sort(sortData);

    if (uniqueChartData.length > 0) candlestickSeries.setData(uniqueChartData)
    if (uniqueVolumeData.length > 0) volumeSeries.setData(uniqueVolumeData)
    volumeLookupRef.current = nextVolumeLookup

    // Fit content on data change
    chartRef.current.timeScale().fitContent()
    // Recompute overlays when base data updates
    computeZoneOverlays()

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
  }, [ohlcData, indicators, maConfig, computeZoneOverlays]) // Re-run when data or config changes

  const explainCandle = useCallback(async () => {
    const candle = lastHoverCandleRef.current
    if (!candle || !indicators) return

    const volumeValue = candle.volume || 0
    const avgVolume = indicators.volume_analysis?.average_volume || 0
    let volumeBucket = 'avg'
    if (avgVolume > 0) {
      if (volumeValue > avgVolume * 1.2) volumeBucket = 'high'
      else if (volumeValue < avgVolume * 0.8) volumeBucket = 'low'
    }

    const priceTrend = indicators.price_trend === 'bullish'
      ? 'up'
      : indicators.price_trend === 'bearish'
        ? 'down'
        : 'range'

    const toNumber = (val) => {
      const num = typeof val === 'string' ? Number(val) : val
      return Number.isFinite(num) ? num : null
    }

    const supportLevels = (indicators.support_levels || []).map(toNumber).filter(v => v !== null)
    const resistanceLevels = (indicators.resistance_levels || []).map(toNumber).filter(v => v !== null)
    const closePrice = candle.close

    const findNearest = (levels) => levels
      .map(level => ({ level, distance: Math.abs(level - closePrice) }))
      .sort((a, b) => a.distance - b.distance)[0]

    const nearestSupport = supportLevels.length ? findNearest(supportLevels) : null
    const nearestResistance = resistanceLevels.length ? findNearest(resistanceLevels) : null

    let nearLevel = 'none'
    let levelPrice = null
    const tolerance = Math.max(closePrice * 0.01, 5) // 1% or ₹5
    if (nearestSupport && nearestSupport.distance <= tolerance) {
      nearLevel = 'support'
      levelPrice = nearestSupport.level
    } else if (nearestResistance && nearestResistance.distance <= tolerance) {
      nearLevel = 'resistance'
      levelPrice = nearestResistance.level
    }

    const payload = {
      ohlc: {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      },
      volume: volumeBucket,
      trend: priceTrend,
      near_level: nearLevel,
      level_price: levelPrice,
      gap: 'none',
      news_flag: false,
      prev_high: null,
      prev_low: null,
    }

    setShowExplain(true)
    explainedCandleTimeRef.current = candle.time
    setExplainState({ loading: true, data: null, error: null })
    try {
      const response = await fetch('/api/explain-candle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)
      const data = await response.json()
      setExplainState({ loading: false, data, error: null })
    } catch (err) {
      setExplainState({ loading: false, data: null, error: err.message || 'Failed to explain candle' })
    }
  }, [indicators])

  const resetExplain = useCallback(() => {
    setExplainState({ loading: false, data: null, error: null })
    setShowExplain(false)
    explainedCandleTimeRef.current = null
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setMarkers([])
    }
  }, [])

  // Highlight explained candle with a marker
  useEffect(() => {
    if (!candlestickSeriesRef.current) return
    const time = explainedCandleTimeRef.current
    if (!time) {
      candlestickSeriesRef.current.setMarkers([])
      return
    }
    candlestickSeriesRef.current.setMarkers([
      {
        time,
        position: 'aboveBar',
        color: '#f59e0b', // amber highlight
        shape: 'circle',
        size: 1,
        text: '★',
      },
    ])
  }, [explainState.data])

  useEffect(() => {
    const node = chartContainerRef.current
    if (!node) return
    const handler = (e) => {
      e.preventDefault()
      explainCandle()
    }
    node.addEventListener('contextmenu', handler)
    return () => node.removeEventListener('contextmenu', handler)
  }, [explainCandle])

  const priceToY = (price) => {
    if (!candlestickSeriesRef.current) return 0
    return candlestickSeriesRef.current.priceToCoordinate(price)
  }

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
          <button
            onClick={handleToggleZones}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showZones
              ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/70'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            title="Toggle accumulation zones"
          >
            Zones: {showZones ? 'On' : 'Off'}
          </button>
          <button
            onClick={handleToggleFailedBreakouts}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFailedBreakouts
              ? 'bg-amber-900/40 border-amber-500/40 text-amber-200 hover:bg-amber-900/70'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            title="Toggle failed breakout markers"
          >
            Failed BO: {showFailedBreakouts ? 'On' : 'Off'}
          </button>
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

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh latest data"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <div className="w-px h-4 bg-slate-700"></div>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <div className="w-px h-4 bg-slate-700"></div>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

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

      {showFailedBreakouts && selectedFailure && (
        <div className="mb-6 bg-slate-950 border border-amber-500/40 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-amber-100 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              Failed Breakout Detail
            </div>
            <div className="text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 rounded border border-amber-500/60 text-amber-200">
                {selectedFailure.confidence} confidence
              </span>
              <button
                onClick={() => setSelectedFailure(null)}
                className="text-slate-400 hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="text-slate-200 mt-2 font-semibold">{selectedFailure.summary}</div>
          <div className="mt-3 text-sm text-slate-200">
            <div className="text-xs uppercase text-slate-400 mb-1">Context</div>
            <ul className="list-disc list-inside space-y-1">
              {selectedFailure.context?.map((c, idx) => <li key={idx}>{c}</li>)}
            </ul>
          </div>
          <div className="mt-3 text-sm text-slate-200">
            <div className="text-xs uppercase text-slate-400 mb-1">What to watch</div>
            <ul className="list-disc list-inside space-y-1">
              {selectedFailure.what_to_watch?.map((c, idx) => <li key={idx}>{c}</li>)}
            </ul>
          </div>
        </div>
      )}

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

        {/* Failed breakout markers */}
        {showFailedBreakouts && failedMarkers.length > 0 && (
          <div className="absolute inset-0 z-[18] pointer-events-none">
            {failedMarkers.map((m) => (
              <div
                key={m.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: m.x - 6,
                  top: m.y - 6,
                  width: 12,
                  height: 12,
                  pointerEvents: 'auto',
                }}
                onMouseEnter={() => setHoverFailure(m.event)}
                onMouseLeave={() => setHoverFailure(null)}
                onClick={() => setSelectedFailure(m.event)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setSelectedFailure(m.event)
                }}
              >
                <div className="w-3 h-3 rounded-full border border-amber-400 bg-amber-500/20 flex items-center justify-center text-[9px] text-amber-300">
                  !
                </div>
              </div>
            ))}
            {hoverFailure && (
              <div
                className="absolute bg-slate-900/95 border border-amber-500/50 text-xs text-slate-100 px-3 py-2 rounded shadow-xl"
                style={{ right: '12px', top: '12px' }}
              >
                <div className="font-semibold flex items-center gap-2 text-amber-200">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                  Failed breakout ({hoverFailure.confidence})
                </div>
                <div className="text-slate-200 mt-1">{hoverFailure.summary}</div>
              </div>
            )}
          </div>
        )}

        {/* Market Structure Zones overlay */}
        {showZones && zoneOverlays.length > 0 && (
          <div className="absolute inset-0 z-[15] pointer-events-none">
            {zoneOverlays.map((rect) => (
              <div
                key={rect.id}
                className="absolute rounded-sm"
                style={{
                  left: rect.left,
                  width: rect.width,
                  top: rect.top,
                  height: rect.height || 1,
                  background: rect.type === 'DISTRIBUTION'
                    ? 'linear-gradient(180deg, rgba(244,63,94,0.08), rgba(190,18,60,0.12))'
                    : 'linear-gradient(180deg, rgba(59,130,246,0.08), rgba(16,185,129,0.12))',
                  border: rect.type === 'DISTRIBUTION'
                    ? '1px solid rgba(244,63,94,0.35)'
                    : '1px solid rgba(14,165,233,0.35)',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={() => setHoverStructure({ type: rect.type, data: rect.zone })}
                onMouseLeave={() => setHoverStructure(null)}
                onClick={() => onSelectStructure({ type: rect.type, data: rect.zone })}
                onContextMenu={(e) => {
                  e.preventDefault()
                  onSelectStructure({ type: rect.type, data: rect.zone })
                }}
              />
            ))}
            {hoverStructure && (
              <div
                className="absolute bg-slate-900/95 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded shadow-xl"
                style={{
                  left: '12px',
                  top: '12px',
                }}
              >
                <div className={`font-semibold flex items-center gap-2 ${hoverStructure.type === 'DISTRIBUTION' ? 'text-rose-300' : 'text-emerald-300'}`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${hoverStructure.type === 'DISTRIBUTION' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  {hoverStructure.type === 'DISTRIBUTION' ? 'Distribution' : 'Accumulation'} zone ({hoverStructure.data.confidence})
                </div>
                <div className="text-slate-300 mt-1">{hoverStructure.data.summary}</div>
              </div>
            )}
          </div>
        )}

        {/* Explain panel */}
        {(showExplain || explainState.loading || explainState.data) && (
          <div className="absolute top-3 right-3 z-[21] w-full max-w-md">
            <div className="bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span role="img" aria-label="brain">🧠</span> Explain this candle
                </div>
                <div className="flex items-center gap-2">
                  {explainState.loading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
                  {!explainState.loading && (
                    <button
                      onClick={explainCandle}
                      className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      Refresh
                    </button>
                  )}
                  <button
                    onClick={resetExplain}
                    className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {explainState.error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/40 rounded p-2">
                  {explainState.error}
                </div>
              )}

              {!explainState.loading && explainState.data && (
                <div className="space-y-2 text-sm text-slate-200">
                  <div className="font-semibold text-slate-100">{explainState.data.summary}</div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Context</div>
                    <ul className="list-disc list-inside text-slate-200 text-sm space-y-0.5">
                      {explainState.data.context.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Interpretation</div>
                    <div className="text-slate-200">{explainState.data.interpretation}</div>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="text-[11px] text-slate-400 uppercase tracking-wide">Decision Impact</div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">What to watch</div>
                    <ul className="list-disc list-inside text-slate-200 text-sm space-y-0.5">
                      {explainState.data.what_to_watch.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 uppercase tracking-wide">Confidence</span>
                    {(() => {
                      const level = (explainState.data.confidence || '').toLowerCase()
                      const colorMap = {
                        low: 'bg-slate-800 text-slate-300 border-slate-700',
                        medium: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
                        high: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
                      }
                      const cls = colorMap[level] || 'bg-slate-800 text-slate-300 border-slate-700'
                      return (
                        <span className={`px-2 py-0.5 rounded border ${cls}`}>
                          {explainState.data.confidence}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              )}

              {!explainState.loading && !explainState.data && !explainState.error && (
                <div className="text-xs text-slate-400">
                  Right-click a candle to generate an explanation.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showZones && selectedStructure && (
        <StructureDetailPanel
          type={selectedStructure.type}
          data={selectedStructure.data}
          onClose={() => onSelectStructure(null)}
        />
      )}

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
