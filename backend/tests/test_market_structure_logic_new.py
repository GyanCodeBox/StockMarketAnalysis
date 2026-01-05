import pytest
from app.services.market_structure_service import MarketStructureService

@pytest.fixture
def ms_service():
    return MarketStructureService()

def test_market_structure_neutral(ms_service, mock_ohlc_data):
    """Test that flat data results in NEUTRAL bias"""
    indicators = {
        "technical_score": {"score": 50},
        "trends": {"short": "sideways", "medium": "sideways"}
    }
    # Mocking underlying services to return no zones
    ms_service.accumulation_service.detect_zones = lambda data, trend_context: []
    ms_service.distribution_service.detect_zones = lambda data, trend_context: []
    ms_service.failed_breakout_service.detect_failed_breakouts = lambda data, indicators: []
    
    res = ms_service.evaluate_structure(mock_ohlc_data, indicators)
    assert res.bias == "NEUTRAL"
    assert res.confidence == "High"

def test_market_structure_accumulation_priority(ms_service):
    """Test that accumulation zone is detected and prioritized over neutral"""
    indicators = {"technical_score": {"score": 60}}
    
    # Mock services
    ms_service.accumulation_service.detect_zones = lambda data, trend_context: [{
        "summary": "Institutional Absorption",
        "confidence": "High",
        "price_range": (98, 102)
    }]
    ms_service.distribution_service.detect_zones = lambda data, trend_context: []
    ms_service.failed_breakout_service.detect_failed_breakouts = lambda data, indicators: []
    
    res = ms_service.evaluate_structure({"data": []}, indicators)
    assert res.bias == "ACCUMULATION"
    assert "Absorption" in res.explanation

def test_market_structure_failed_breakout_override(ms_service):
    """Test that failed breakout overrides accumulation/distribution"""
    indicators = {"technical_score": {"score": 80}}
    
    # Both accumulation AND failed breakout detected
    ms_service.accumulation_service.detect_zones = lambda data, trend_context: [{"summary": "Buy Zone"}]
    ms_service.failed_breakout_service.detect_failed_breakouts = lambda data, indicators: [{
        "summary": "Bull Trap detected",
        "direction": "up",
        "confidence": "High"
    }]
    
    res = ms_service.evaluate_structure({"data": []}, indicators)
    assert res.bias == "FAILED_BREAKOUT"
    assert "trap" in res.explanation.lower()
