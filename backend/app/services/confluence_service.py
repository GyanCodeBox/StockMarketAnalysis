"""
Confluence Service - Tech-Fundamental Alignment Detection
Answers: "Is price aligned with business reality?"
"""
from typing import Dict, Any, Tuple
from enum import Enum


class TechnicalRegime(str, Enum):
    ACCUMULATION = "ACCUMULATION"
    NEUTRAL = "NEUTRAL"
    DISTRIBUTION = "DISTRIBUTION"
    FAILED_BREAKOUT = "FAILED_BREAKOUT"


class FundamentalRegime(str, Enum):
    STRONG = "STRONG"
    NEUTRAL = "NEUTRAL"
    WEAK = "WEAK"


class ConfluenceConfidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ConfluenceService:
    """
    Maps Technical × Fundamental regimes into a 3x3 decision intelligence matrix.
    Provides institutional-grade explanations for alignment/misalignment.
    """
    
    # 3x3 Confluence Matrix (Technical × Fundamental)
    CONFLUENCE_MATRIX = {
        # ACCUMULATION ROW
        (TechnicalRegime.ACCUMULATION, FundamentalRegime.STRONG): {
            "label": "Aligned Strength",
            "confidence": ConfluenceConfidence.HIGH,
            "explanation": "Price accumulation supported by strong fundamental momentum—both price and business confirm strength",
            "risk_level": RiskLevel.LOW,
            "institutional_note": "High-conviction setup with technical and fundamental confirmation",
            "subtitle": "Strong fundamental support with constructive price structure"
        },
        (TechnicalRegime.ACCUMULATION, FundamentalRegime.NEUTRAL): {
            "label": "Early Opportunity",
            "confidence": ConfluenceConfidence.MEDIUM,
            "explanation": "Technical strength ahead of fundamental confirmation—price may be anticipating improvement",
            "risk_level": RiskLevel.MEDIUM,
            "institutional_note": "Monitor for fundamental inflection to validate technical positioning"
        },
        (TechnicalRegime.ACCUMULATION, FundamentalRegime.WEAK): {
            "label": "Structural Risk",
            "confidence": ConfluenceConfidence.LOW,
            "explanation": "Price accumulation despite weak business fundamentals—technical strength lacks fundamental support",
            "risk_level": RiskLevel.HIGH,
            "institutional_note": "Elevated risk of failed breakout if fundamentals do not improve"
        },
        
        # NEUTRAL ROW
        (TechnicalRegime.NEUTRAL, FundamentalRegime.STRONG): {
            "label": "Fundamentals Leading",
            "confidence": ConfluenceConfidence.MEDIUM,
            "explanation": "Strong fundamentals not yet reflected in price action—potential value opportunity",
            "risk_level": RiskLevel.MEDIUM,
            "institutional_note": "Watch for technical confirmation to validate fundamental strength"
        },
        (TechnicalRegime.NEUTRAL, FundamentalRegime.NEUTRAL): {
            "label": "Indecision",
            "confidence": ConfluenceConfidence.LOW,
            "explanation": "Both price and fundamentals lack clear direction—awaiting catalyst",
            "risk_level": RiskLevel.MEDIUM,
            "institutional_note": "Low conviction environment—wait for regime clarity"
        },
        (TechnicalRegime.NEUTRAL, FundamentalRegime.WEAK): {
            "label": "Drift Risk",
            "confidence": ConfluenceConfidence.LOW,
            "explanation": "Weak fundamental momentum combined with non-directional price behavior increases probability of downside resolution",
            "risk_level": RiskLevel.HIGH,
            "institutional_note": "Vulnerable to distribution if fundamentals deteriorate further",
            "subtitle": "Weak fundamental support with non-committal price structure"
        },
        
        # DISTRIBUTION ROW
        (TechnicalRegime.DISTRIBUTION, FundamentalRegime.STRONG): {
            "label": "Valuation Risk",
            "confidence": ConfluenceConfidence.MEDIUM,
            "explanation": "Price distribution despite strong fundamentals—potential overvaluation or profit-taking",
            "risk_level": RiskLevel.MEDIUM,
            "institutional_note": "Monitor for fundamental deterioration or technical stabilization"
        },
        (TechnicalRegime.DISTRIBUTION, FundamentalRegime.NEUTRAL): {
            "label": "Exhaustion",
            "confidence": ConfluenceConfidence.MEDIUM,
            "explanation": "Price distribution with neutral fundamentals—momentum fading without fundamental catalyst",
            "risk_level": RiskLevel.HIGH,
            "institutional_note": "Risk of downside acceleration if fundamentals weaken"
        },
        (TechnicalRegime.DISTRIBUTION, FundamentalRegime.WEAK): {
            "label": "Aligned Weakness",
            "confidence": ConfluenceConfidence.HIGH,
            "explanation": "Price distribution confirmed by weak fundamentals—both price and business show deterioration",
            "risk_level": RiskLevel.HIGH,
            "institutional_note": "High-conviction bearish setup with technical and fundamental confirmation"
        },
        
        # FAILED_BREAKOUT (treated as Distribution variant)
        (TechnicalRegime.FAILED_BREAKOUT, FundamentalRegime.STRONG): {
            "label": "Technical Failure",
            "confidence": ConfluenceConfidence.LOW,
            "explanation": "Failed breakout despite strong fundamentals—price unable to sustain momentum",
            "risk_level": RiskLevel.MEDIUM,
            "institutional_note": "Reassess if fundamentals can drive renewed technical strength"
        },
        (TechnicalRegime.FAILED_BREAKOUT, FundamentalRegime.NEUTRAL): {
            "label": "Momentum Loss",
            "confidence": ConfluenceConfidence.LOW,
            "explanation": "Failed breakout with neutral fundamentals—lack of conviction on both fronts",
            "risk_level": RiskLevel.HIGH,
            "institutional_note": "High risk of further deterioration without catalyst"
        },
        (TechnicalRegime.FAILED_BREAKOUT, FundamentalRegime.WEAK): {
            "label": "Confirmed Breakdown",
            "confidence": ConfluenceConfidence.HIGH,
            "explanation": "Failed breakout confirmed by weak fundamentals—technical and fundamental deterioration aligned",
            "risk_level": RiskLevel.HIGH,
            "institutional_note": "Avoid until both technical and fundamental regimes stabilize"
        },
    }
    
    @classmethod
    def get_confluence_state(
        cls,
        technical_regime: str,
        fundamental_regime: str
    ) -> Dict[str, Any]:
        """
        Determine confluence state from technical and fundamental regimes.
        
        Args:
            technical_regime: Current technical regime (ACCUMULATION, NEUTRAL, DISTRIBUTION, FAILED_BREAKOUT)
            fundamental_regime: Current fundamental regime (STRONG, NEUTRAL, WEAK)
            
        Returns:
            Dict containing confluence state, confidence, explanation, and risk level
        """
        # Normalize inputs
        try:
            tech = TechnicalRegime(technical_regime.upper())
            funda = FundamentalRegime(fundamental_regime.upper())
        except (ValueError, AttributeError):
            # Fallback for invalid inputs
            return cls._get_default_state()
        
        # Lookup in matrix
        confluence_key = (tech, funda)
        confluence_data = cls.CONFLUENCE_MATRIX.get(confluence_key)
        
        if not confluence_data:
            return cls._get_default_state()
        
        return {
            "state": confluence_data["label"],
            "confidence": confluence_data["confidence"].value,
            "explanation": confluence_data["explanation"],
            "institutional_note": confluence_data["institutional_note"],
            "risk_level": confluence_data["risk_level"].value,
            "technical_regime": tech.value,
            "fundamental_regime": funda.value
        }
    
    @classmethod
    def _get_default_state(cls) -> Dict[str, Any]:
        """Fallback state when inputs are invalid or missing."""
        return {
            "state": "Indecision",
            "confidence": ConfluenceConfidence.LOW.value,
            "explanation": "Insufficient data to determine confluence state",
            "institutional_note": "Awaiting clear regime signals",
            "risk_level": RiskLevel.MEDIUM.value,
            "technical_regime": "UNKNOWN",
            "fundamental_regime": "UNKNOWN"
        }
    
    @classmethod
    def get_matrix_visualization(cls) -> str:
        """
        Generate a text representation of the confluence matrix for documentation.
        """
        matrix_text = "Tech-Fundamental Confluence Matrix\n"
        matrix_text += "=" * 80 + "\n\n"
        
        for tech in [TechnicalRegime.ACCUMULATION, TechnicalRegime.NEUTRAL, TechnicalRegime.DISTRIBUTION]:
            matrix_text += f"\n{tech.value}:\n"
            matrix_text += "-" * 80 + "\n"
            for funda in [FundamentalRegime.STRONG, FundamentalRegime.NEUTRAL, FundamentalRegime.WEAK]:
                key = (tech, funda)
                data = cls.CONFLUENCE_MATRIX.get(key, {})
                matrix_text += f"  × {funda.value:8} → {data.get('label', 'N/A'):20} "
                matrix_text += f"[{data.get('confidence', 'N/A'):6}] "
                matrix_text += f"Risk: {data.get('risk_level', 'N/A')}\n"
        
        return matrix_text
