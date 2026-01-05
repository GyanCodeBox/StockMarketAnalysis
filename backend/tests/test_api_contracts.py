import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def mock_tech_response():
    return {
        "symbol": "RELIANCE",
        "exchange": "NSE",
        "quote": {"last_price": 2500, "change": 10, "change_percent": 0.4},
        "indicators": {
            "technical_score": {"score": 75},
            "sma_20": 2400,
            "sma_50": 2350,
            "sma_200": 2200
        },
        "market_structure": {
            "current_bias": "ACCUMULATION",
            "confidence": "HIGH",
            "explanation": "Test explanation"
        },
        "ohlc_data": {"data": []}
    }

@pytest.fixture
def mock_fund_response():
    return {
        "symbol": "RELIANCE",
        "score": {"value": 80, "grade": "Strong", "phase": "Growth"},
        "derived": {"yoy": [{"sales_yoy_pct": 15}]},
        "ownership": []
    }

def test_analyze_endpoint_schema(client):
    """Verify /api/analyze return structure"""
    with patch("app.routes.analyze_technical") as mock_tech:
        mock_tech.return_value = {
            "symbol": "RELIANCE",
            "quote": {"last_price": 2500},
            "indicators": {},
            "analysis": "Mock analysis"
        }
        
        response = client.post("/api/analyze", json={"symbol": "RELIANCE", "exchange": "NSE"})
        assert response.status_code == 200
        data = response.json()
        assert "symbol" in data
        assert "quote" in data
        assert "indicators" in data
        assert "analysis" in data

def test_portfolio_summary_schema(client):
    """Verify /api/portfolio/summary return structure"""
    from app.routers.portfolio import PortfolioStock
    with patch("app.routers.portfolio.analyze_single_stock") as mock_single:
        mock_single.return_value = PortfolioStock(
            symbol="RELIANCE",
            confluence_state="Aligned Strength",
            confluence_fmt="accumulation · strong",
            composite_score=85.0,
            risk_level="LOW",
            key_constraint="None",
            attention_flag="STABLE",
            stability="Stable"
        )
        
        response = client.post("/api/portfolio/summary", json={"symbols": ["RELIANCE"]})
        assert response.status_code == 200
        data = response.json()
        assert "stocks" in data
        assert "summary" in data
        assert len(data["stocks"]) == 1
        assert data["stocks"][0]["symbol"] == "RELIANCE"

def test_metrics_only_mode(client):
    """Verify that mode='metrics_only' returns structural data on the analyze/summary endpoint"""
    # Optimized endpoint at /api/analyze/summary
    with patch("app.routes.analyze_technical") as mock_tech, \
         patch("app.routes.get_fundamental_financials") as mock_fund:
        
        mock_tech.return_value = {"market_structure": {"bias": "ACCUMULATION"}, "quote": {"last_price": 100}, "indicators": {}}
        mock_fund.return_value = {"score": {"grade": "Strong"}}
        
        # Test the summary endpoint directly
        response = client.post("/api/analyze/summary", json={
            "symbol": "RELIANCE", 
            "mode": "metrics_only"
        })
        assert response.status_code == 200
        data = response.json()
        assert "technical" in data
        assert "fundamental" in data
