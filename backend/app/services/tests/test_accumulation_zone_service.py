import pytest

from app.services.accumulation_zone_service import AccumulationZoneService


def build_candles(base=100, drift=-0.1, count=20, volume=1_000_000):
    data = []
    price = base
    for i in range(count):
        price += drift
        open_p = price
        high = price * 1.01
        low = price * 0.99
        close = price * 1.002
        data.append(
            {
                "open": open_p,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume * (1 + (0.05 if i % 3 == 0 else 0)),
                "date": f"2024-01-{i+1:02d}",
            }
        )
    return {"data": data, "interval": "day"}


def test_detects_single_zone():
    svc = AccumulationZoneService()
    ohlc = build_candles()
    zones = svc.detect_zones(ohlc)
    assert zones, "Expected at least one accumulation zone"
    z = zones[0]
    assert z["zone_low"] < z["zone_high"]
    assert z["duration"] >= svc.min_duration
    assert z["confidence"] in ("Low", "Medium", "High")


def test_filters_without_data():
    svc = AccumulationZoneService()
    zones = svc.detect_zones({"data": []})
    assert zones == []


