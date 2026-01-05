import pytest
from app.services.confluence_service import ConfluenceService
from app.services.composite_scoring_service import CompositeScoringService
from app.services.risk_constraint_service import RiskConstraintService

def test_confluence_matrix():
    """Verify matrix mapping for major regimes"""
    # Bullish Tech + Strong Funda = Aligned Strength
    res = ConfluenceService.get_confluence_state("ACCUMULATION", "Strong")
    assert res['state'] == "Aligned Strength"
    assert res['risk_level'] == "LOW"
    
    # Bearish Tech + Weak Funda = Institutional Distribution (wait, check label)
    # Actually (DISTRIBUTION, WEAK) -> check confluence_service.py
    # From service: (TechnicalRegime.DISTRIBUTION, FundamentalRegime.WEAK) -> "Institutional Distribution" is likely
    # Let's check logic for (DISTRIBUTION, WEAK)
    res = ConfluenceService.get_confluence_state("DISTRIBUTION", "Weak")
    assert res['risk_level'] == "HIGH"

    # Neutral combinations
    res = ConfluenceService.get_confluence_state("NEUTRAL", "Neutral")
    assert res['state'] == "Indecision"

def test_composite_score_calculation():
    """Test weighted composite score logic"""
    # Perfect scores should yield 100
    res = CompositeScoringService.calculate_composite_score(
        technical_score=100,
        fundamental_score=100,
        stability_score=100
    )
    assert res['value'] == 100
    assert res['band'] == "STRONG"

    # Average scores should yield around 50
    res = CompositeScoringService.calculate_composite_score(
        technical_score=50,
        fundamental_score=50,
        stability_score=50
    )
    assert 45 <= res['value'] <= 55
    assert res['band'] == "NEUTRAL"

def test_risk_constraints_triggers():
    """Test that extreme negative metrics trigger risk constraints"""
    # Test High Other Income constraint
    funda_metrics = {
        "other_income_ratio": 0.4, # 40% (Threshold is usually 30% for HIGH)
        "roce": 15,
        "net_margin_pct": 10,
        "net_margin_yoy_delta": 0
    }
    tech_data = {"regime": "ACCUMULATION", "confidence": "HIGH"}
    
    constraints = RiskConstraintService.assess_risk_constraints(funda_metrics, tech_data)
    assert any(c['dimension'] == "Earnings Quality" and c['severity'] == "HIGH" for c in constraints)
    
    # Test Margin Pressure
    funda_metrics_marginal = {
        "other_income_ratio": 0.05,
        "roce": 15,
        "net_margin_pct": 5,
        "net_margin_yoy_delta": -1.5 # -1.5% drop (Threshold 1% for HIGH)
    }
    constraints = RiskConstraintService.assess_risk_constraints(funda_metrics_marginal, tech_data)
    assert any("Margin" in c['dimension'] and c['severity'] == "HIGH" for c in constraints)

def test_risk_summary_logic():
    """Verify overall risk assessment"""
    # No constraints = LOW risk
    summary = RiskConstraintService.get_risk_summary([])
    assert summary['overall_risk'] == "LOW"
    
    # One medium constraint
    summary = RiskConstraintService.get_risk_summary([{"severity": "MEDIUM"}])
    assert summary['overall_risk'] == "LOW-MEDIUM"
    
    # One high constraint
    summary = RiskConstraintService.get_risk_summary([{"severity": "HIGH"}])
    assert summary['overall_risk'] == "MEDIUM-HIGH"
