import pytest
from app.services.distribution_zone_service import DistributionZoneService

def generate_candles(count, trend_pct=0):
    candles = []
    base_price = 100
    for i in range(count):
        price = base_price * (1 + (trend_pct * (i / count)))
        # Make advance phase volatile to avoid false positive compression zones
        candles.append({
            "time": i,
            "open": price,
            "high": price + 15,
            "low": price - 15,
            "close": price,
            "volume": 1000
        })
    return candles

def test_distribution_preconditions_fail_no_trend():
    service = DistributionZoneService()
    # Case: No prior advance (flat)
    data = {"data": generate_candles(100, trend_pct=0)}
    zones = service.detect_zones(data)
    assert len(zones) == 0

def test_distribution_preconditions_pass_with_trend():
    service = DistributionZoneService()
    # Case: +60% advance
    candles = generate_candles(100, trend_pct=0.60)
    
    # Add a distribution zone at the end
    # Tight compression (range 2 on price ~140-160)
    for i in range(85, 100):
        candles[i] = {
            "time": candles[i]["time"],
            "open": 150, "high": 152, "low": 150, "close": 151, "volume": 1200
        }
    
    data = {"data": candles}
    zones = service.detect_zones(data)
    assert len(zones) >= 1
    assert zones[0]["confidence"] in ["High", "Medium", "Low"]

def test_distribution_scoring_high_confidence():
    service = DistributionZoneService()
    # Preconditions: +60% trend
    candles = generate_candles(100, trend_pct=0.60)
    
    # Perfect Distribution Window (Score 7)
    for i in range(80, 100):
        # Range is 150 to 154 (Compression ~2.6%)
        candles[i] = {
            "time": candles[i]["time"],
            "open": 152, "high": 154, "low": 150, "close": 151, "volume": 1500 # High volume churn
        }
        # Upper wick: 154 - 152 = 2 on range 4 = 0.5 ratio
        # Close pos: (151 - 150) / 4 = 0.25 ratio
        
    data = {"data": candles}
    zones = service.detect_zones(data)
    assert len(zones) > 0
    assert zones[0]["confidence"] == "High"
    assert "compression_pct" in zones[0]["metrics"]
    assert zones[0]["metrics"]["upper_wick_count"] >= 2

def test_distribution_rejection_on_upside_closes():
    service = DistributionZoneService()
    # Preconditions: +60% trend
    candles = generate_candles(100, trend_pct=0.60)
    
    # Window looks like distribution but closes are at HIGH (Absorption/Breakout prep)
    zone_high = 154
    for i in range(80, 100):
        # Closes significantly above zone high (154 * 1.002 = 154.3)
        candles[i] = {
            "time": candles[i]["time"],
            "open": 151, "high": 154, "low": 150, "close": 154.5, "volume": 1500
        }
    
    data = {"data": candles}
    zones = service.detect_zones(data)
    # Should reject due to UPSIDE_ACCEPTANCE
    assert len(zones) == 0

def test_market_structure_transitions_structured():
    from app.services.market_structure_service import MarketStructureService
    service = MarketStructureService()
    
    # Simulate Accumulation
    data = {"data": generate_candles(100, trend_pct=0)}
    for i in range(80, 100):
        data["data"][i] = {"time": i, "open": 100, "high": 101, "low": 99, "close": 100, "volume": 500}
    
    res1 = service.evaluate_structure(data)
    assert res1.bias == "ACCUMULATION"
    
    # Simulate shift to Failed Breakout
    # 1. First create a "breakout" candle
    data["data"][-2] = {"time": 99, "open": 101, "high": 106, "low": 101, "close": 105, "volume": 2000}
    # 2. Then a "failure" candle (sharp drop back below)
    data["data"][-1] = {"time": 100, "open": 105, "high": 105, "low": 95, "close": 96, "volume": 2500}
    
    res2 = service.evaluate_structure(data, previous_bias=res1.bias)
    assert res2.bias == "FAILED_BREAKOUT"
    assert res2.transition == {"from": "ACCUMULATION", "to": "FAILED_BREAKOUT"}
    assert "Accumulation" in res2.transition_narration
    assert "Failed_breakout" in res2.transition_narration

def test_daily_distribution_invariance():
    """Ensure daily behavior remains unchanged after timeframe scaling."""
    service = DistributionZoneService()
    # Moderate trend, but we'll override for specific structure
    candles = generate_candles(200, trend_pct=1.0)
    
    # Deep base at index 150-170
    for i in range(150, 171):
        # Index 169 (30 bars ago from 200) is 100
        # Index 139 (60 bars ago from 200) is 100
        candles[i] = {"time": i, "open": 100, "high": 120, "low": 80, "close": 100, "volume": 1000}
    
    # Strong rally
    for i in range(171, 180):
        candles[i] = {"time": i, "open": 200, "high": 250, "low": 180, "close": 250, "volume": 1000}

    # 10.1% compression uniform (threshold is 5% for daily, 12% for weekly)
    for i in range(180, 200):
        # Range is significant: High 310, Low 280 => Mid 295 => Range 30 => ~10.17% compression
        candles[i] = {
            "time": candles[i]["time"],
            "open": 295, "high": 310, "low": 280, "close": 290, "volume": 1500
        }
        
    data = {"data": candles}
    
    # Test as Daily (Explicitly)
    zones_daily = service.detect_zones(data, timeframe="day")
    assert len(zones_daily) == 0, "Should reject ~7.8% compression on Daily timeframe (tol=5%)"
    
    # Test as Weekly (Explicitly)
    zones_weekly = service.detect_zones(data, timeframe="week")
    assert len(zones_weekly) > 0, "Should accept ~7.8% compression on Weekly timeframe (tol=12%)"
