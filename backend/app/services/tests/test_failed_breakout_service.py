import pytest

from app.services.failed_breakout_service import FailedBreakoutService


def build_upside_breakout_failure():
  data = []
  price = 100.0
  # Base range
  for i in range(25):
      high = price * 1.01
      low = price * 0.99
      close = price * 1.005
      data.append({
          "open": price,
          "high": high,
          "low": low,
          "close": close,
          "volume": 1_000_000,
          "date": f"2024-01-{i+1:02d}",
      })
      price *= 1.001
  level = max(d["high"] for d in data)
  # Breakout candle
  data.append({
      "open": level * 0.999,
      "high": level * 1.02,
      "low": level * 0.998,
      "close": level * 1.01,
      "volume": 900_000,  # below average
      "date": "2024-01-26",
  })
  # Failure candle back inside range
  data.append({
      "open": level * 1.005,
      "high": level * 1.006,
      "low": level * 0.995,
      "close": level * 0.997,
      "volume": 1_100_000,
      "date": "2024-01-27",
  })
  return {"data": data, "interval": "day"}


def test_detects_failed_upside_breakout():
    svc = FailedBreakoutService()
    ohlc = build_upside_breakout_failure()
    events = svc.detect_failed_breakouts(ohlc)
    assert events, "Expected at least one failed breakout event"
    ev = events[0]
    assert ev["direction"] in ("up", "down")
    assert ev["failure_type"]
    assert isinstance(ev["context"], list) and ev["context"]
    assert ev["confidence"] in ("Low", "Medium", "High")


