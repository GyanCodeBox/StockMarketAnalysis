import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.utils.llm_schema_validator import validate_decision_brief

def test_valid_brief():
    data = {
        "headline": "Institutional Alignment Check",
        "primary_observation": "Price structure remains in technical alignment.",
        "dominant_risk": "Regime volatility exceeds historical norms.",
        "monitoring_points": ["Point 1", "Point 2"],
        "confidence_note": "Non-predictive assessment."
    }
    result = validate_decision_brief(data)
    assert result["headline"] == data["headline"]

def test_invalid_language():
    data = {
        "headline": "Buy this stock now",
        "primary_observation": "Price structure remains in technical alignment.",
        "dominant_risk": "Regime volatility exceeds historical norms.",
        "monitoring_points": ["Point 1", "Point 2"],
        "confidence_note": "Non-predictive assessment."
    }
    try:
        validate_decision_brief(data)
        assert False, "Should have raised ValueError for 'buy'"
    except ValueError as e:
        assert "Language violation" in str(e)

def test_missing_field():
    data = {
        "headline": "Institutional Alignment Check",
        "monitoring_points": ["Point 1", "Point 2"],
        "confidence_note": "Non-predictive assessment."
    }
    try:
        validate_decision_brief(data)
        assert False, "Should have raised ValueError for missing fields"
    except ValueError as e:
        assert "validation error" in str(e).lower()

if __name__ == "__main__":
    test_valid_brief()
    test_invalid_language()
    test_missing_field()
    print("All backend schema tests passed.")
