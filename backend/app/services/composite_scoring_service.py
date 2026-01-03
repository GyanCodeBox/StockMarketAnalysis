"""
Composite Scoring Service - Unified Regime Scoring
Provides portfolio-ranking signal without reducing nuance
"""
from typing import Dict, Any


class CompositeScoringService:
    """
    Calculates a unified 0-100 composite score from:
    - Technical Score (40%)
    - Fundamental Score (40%)
    - Stability Score (20%)
    
    NOT a recommendation—a comparison and ranking tool.
    """
    
    # Weight distribution
    WEIGHTS = {
        "technical": 0.40,
        "fundamental": 0.40,
        "stability": 0.20
    }
    
    # Band thresholds
    BANDS = {
        "STRONG": (70, 100),
        "NEUTRAL": (40, 69),
        "WEAK": (0, 39)
    }
    
    @classmethod
    def calculate_composite_score(
        cls,
        technical_score: float,
        fundamental_score: float,
        stability_score: float
    ) -> Dict[str, Any]:
        """
        Calculate composite regime score with attribution.
        
        Args:
            technical_score: Technical regime score (0-100)
            fundamental_score: Fundamental regime score (0-100)
            stability_score: Regime stability score (0-100)
            
        Returns:
            Dict containing composite score, band, and attribution breakdown
        """
        # Normalize inputs to 0-100 range
        tech = max(0, min(100, technical_score))
        funda = max(0, min(100, fundamental_score))
        stability = max(0, min(100, stability_score))
        
        # Calculate weighted composite
        composite_value = (
            tech * cls.WEIGHTS["technical"] +
            funda * cls.WEIGHTS["fundamental"] +
            stability * cls.WEIGHTS["stability"]
        )
        
        # Determine band
        band = cls._get_band(composite_value)
        
        # Calculate attribution (contribution to final score)
        tech_contribution = tech * cls.WEIGHTS["technical"]
        funda_contribution = funda * cls.WEIGHTS["fundamental"]
        stability_contribution = stability * cls.WEIGHTS["stability"]
        
        # Calculate percentage breakdown
        total_contribution = tech_contribution + funda_contribution + stability_contribution
        if total_contribution > 0:
            tech_pct = (tech_contribution / total_contribution) * 100
            funda_pct = (funda_contribution / total_contribution) * 100
            stability_pct = (stability_contribution / total_contribution) * 100
        else:
            tech_pct = funda_pct = stability_pct = 0
        
        return {
            "value": round(composite_value, 1),
            "band": band,
            "attribution": {
                "technical": round(tech, 1),
                "fundamental": round(funda, 1),
                "stability": round(stability, 1)
            },
            "breakdown": {
                "technical_pct": round(tech_pct, 1),
                "fundamental_pct": round(funda_pct, 1),
                "stability_pct": round(stability_pct, 1)
            },
            "weights": cls.WEIGHTS
        }
    
    @classmethod
    def _get_band(cls, score: float) -> str:
        """Determine band classification from score."""
        for band, (low, high) in cls.BANDS.items():
            if low <= score <= high:
                return band
        return "NEUTRAL"  # Fallback
    
    @classmethod
    def get_band_description(cls, band: str) -> str:
        """Get institutional description for each band."""
        descriptions = {
            "STRONG": "High-conviction regime with sustained strength across multiple dimensions",
            "NEUTRAL": "Mixed signals or transitional state—monitor for regime clarity",
            "WEAK": "Deteriorating conditions across technical and fundamental factors"
        }
        return descriptions.get(band, "Regime classification unavailable")
