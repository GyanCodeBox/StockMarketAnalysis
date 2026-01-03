"""
Risk Constraint Service - Multi-Dimensional Risk Intelligence
Focus on risk containment rather than upside narratives
"""
from typing import Dict, Any, List


class RiskDimension:
    """Risk dimension categories."""
    EARNINGS_QUALITY = "Earnings Quality"
    CAPITAL_EFFICIENCY = "Capital Efficiency"
    PRICE_STRUCTURE = "Price Structure"
    MARGIN_PRESSURE = "Margin Pressure"


class RiskSeverity:
    """Risk severity levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class RiskConstraintService:
    """
    Identifies and articulates risk constraints across multiple dimensions.
    Institutional focus: What limits upside or increases downside risk?
    """
    
    @classmethod
    def assess_risk_constraints(
        cls,
        fundamental_data: Dict[str, Any],
        technical_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Assess all risk dimensions and return active constraints.
        
        Args:
            fundamental_data: Latest fundamental metrics (ROCE, margins, other income, etc.)
            technical_data: Technical regime and confidence
            
        Returns:
            List of risk constraint dictionaries
        """
        constraints = []
        
        # 1. Earnings Quality Risk
        quality_risk = cls._assess_earnings_quality(fundamental_data)
        if quality_risk:
            constraints.append(quality_risk)
        
        # 2. Capital Efficiency Risk
        efficiency_risk = cls._assess_capital_efficiency(fundamental_data)
        if efficiency_risk:
            constraints.append(efficiency_risk)
        
        # 3. Price Structure Risk
        price_risk = cls._assess_price_structure(technical_data)
        if price_risk:
            constraints.append(price_risk)
        
        # 4. Margin Pressure Risk
        margin_risk = cls._assess_margin_pressure(fundamental_data)
        if margin_risk:
            constraints.append(margin_risk)
        
        return constraints
    
    @classmethod
    def _assess_earnings_quality(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess earnings quality based on other income dependency.
        
        Thresholds:
        - < 15%: Healthy (no constraint)
        - 15-30%: Medium risk
        - > 30%: High risk
        """
        other_income_ratio = data.get("other_income_ratio", 0)
        other_income_pct = other_income_ratio * 100
        
        if other_income_pct < 15:
            return None  # No constraint
        
        if other_income_pct >= 30:
            severity = RiskSeverity.HIGH
            statement = f"Other income at {other_income_pct:.1f}% of net profit indicates weak core earnings quality"
        else:  # 15-30%
            severity = RiskSeverity.MEDIUM
            statement = f"Other income at {other_income_pct:.1f}% of net profit warrants monitoring for earnings sustainability"
        
        return {
            "dimension": RiskDimension.EARNINGS_QUALITY,
            "severity": severity,
            "statement": statement,
            "metric_value": round(other_income_pct, 1),
            "threshold": 15.0,
            "institutional_note": "High non-operating income dependency reduces earnings predictability"
        }
    
    @classmethod
    def _assess_capital_efficiency(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess capital efficiency based on ROCE vs cost of capital.
        
        Thresholds:
        - ROCE > 14%: No constraint
        - ROCE 10-14%: Medium risk
        - ROCE < 10%: High risk
        """
        roce = data.get("roce", 0)
        cost_of_capital = 14.0  # Benchmark
        
        if roce >= cost_of_capital:
            return None  # No constraint
        
        gap = cost_of_capital - roce
        
        if roce < 10:
            severity = RiskSeverity.HIGH
            statement = f"ROCE at {roce:.1f}% significantly below cost of capital ({cost_of_capital}%), destroying shareholder value"
        else:  # 10-14%
            severity = RiskSeverity.MEDIUM
            statement = f"ROCE at {roce:.1f}% below cost of capital ({cost_of_capital}%), limiting valuation expansion"
        
        return {
            "dimension": RiskDimension.CAPITAL_EFFICIENCY,
            "severity": severity,
            "statement": statement,
            "metric_value": round(roce, 1),
            "threshold": cost_of_capital,
            "gap": round(gap, 1),
            "institutional_note": "Returns below cost of capital constrain sustainable growth and valuation multiples"
        }
    
    @classmethod
    def _assess_price_structure(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess price structure risk based on technical regime.
        
        Risk regimes:
        - DISTRIBUTION: High risk
        - FAILED_BREAKOUT: High risk
        - NEUTRAL with low confidence: Medium risk
        """
        regime = data.get("regime", "").upper()
        confidence = data.get("confidence", "").upper()
        
        if regime == "DISTRIBUTION":
            severity = RiskSeverity.HIGH
            statement = "Price in distribution phase indicates institutional selling and downside risk"
            note = "Distribution regimes often precede sustained declines"
        
        elif regime == "FAILED_BREAKOUT":
            severity = RiskSeverity.HIGH
            statement = "Failed breakout signals momentum exhaustion and elevated downside risk"
            note = "Failed breakouts frequently lead to reversion or further deterioration"
        
        elif regime == "NEUTRAL" and confidence == "LOW":
            severity = RiskSeverity.MEDIUM
            statement = "Indecisive price action with low conviction increases directional uncertainty"
            note = "Low-conviction environments vulnerable to sudden regime shifts"
        
        else:
            return None  # No constraint for ACCUMULATION or high-confidence NEUTRAL
        
        return {
            "dimension": RiskDimension.PRICE_STRUCTURE,
            "severity": severity,
            "statement": statement,
            "regime": regime,
            "confidence": confidence,
            "institutional_note": note
        }
    
    @classmethod
    def _assess_margin_pressure(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess margin pressure based on margin trends.
        
        Risk indicators:
        - Negative margin delta > -1%: High risk
        - Negative margin delta -0.5% to -1%: Medium risk
        """
        margin_delta = data.get("net_margin_yoy_delta", 0)
        current_margin = data.get("net_margin_pct", 0)
        
        if margin_delta >= -0.5:
            return None  # No significant pressure
        
        if margin_delta <= -1.0:
            severity = RiskSeverity.HIGH
            statement = f"Net margin contracted {abs(margin_delta):.1f}% YoY, indicating severe profitability pressure"
        else:  # -0.5 to -1.0
            severity = RiskSeverity.MEDIUM
            statement = f"Net margin contracted {abs(margin_delta):.1f}% YoY, warranting monitoring for sustained pressure"
        
        return {
            "dimension": RiskDimension.MARGIN_PRESSURE,
            "severity": severity,
            "statement": statement,
            "metric_value": round(margin_delta, 2),
            "current_margin": round(current_margin, 1),
            "institutional_note": "Margin compression threatens earnings growth and return on capital"
        }
    
    @classmethod
    def get_risk_summary(cls, constraints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary of risk profile.
        
        Returns:
            Dict with overall risk level and constraint count by severity
        """
        if not constraints:
            return {
                "overall_risk": "LOW",
                "constraint_count": 0,
                "high_severity_count": 0,
                "medium_severity_count": 0,
                "summary": "No significant risk constraints identified"
            }
        
        high_count = sum(1 for c in constraints if c["severity"] == RiskSeverity.HIGH)
        medium_count = sum(1 for c in constraints if c["severity"] == RiskSeverity.MEDIUM)
        
        # Determine overall risk
        if high_count >= 2:
            overall = "HIGH"
            summary = "Multiple material risk constraints identified; elevated risk environment warrants caution"
        elif high_count == 1:
            overall = "MEDIUM-HIGH"
            summary = "Material risk constraint identified; active monitoring warranted"
        elif medium_count >= 2:
            overall = "MEDIUM"
            summary = "Multiple medium-severity constraints—cautious approach warranted"
        else:
            overall = "LOW-MEDIUM"
            summary = "Limited constraints—manageable risk profile"
        
        return {
            "overall_risk": overall,
            "constraint_count": len(constraints),
            "high_severity_count": high_count,
            "medium_severity_count": medium_count,
            "summary": summary
        }
