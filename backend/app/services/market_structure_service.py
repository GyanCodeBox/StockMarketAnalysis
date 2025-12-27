"""
Market Structure Decision Matrix Service
Arbitrates between Accumulation, Failed Breakout, and Neutral states based on priority rules.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import logging

from app.services.accumulation_zone_service import AccumulationZoneService, AccumulationZone
from app.services.failed_breakout_service import FailedBreakoutService, FailedBreakoutEvent

logger = logging.getLogger(__name__)

@dataclass
class MarketStructureState:
    bias: str  # "ACCUMULATION" | "FAILED_BREAKOUT" | "NEUTRAL"
    confidence: str  # "High" | "Medium" | "Low"
    explanation: str
    details: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "bias": self.bias,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "details": self.details
        }

class MarketStructureService:
    def __init__(self):
        self.accumulation_service = AccumulationZoneService()
        self.failed_breakout_service = FailedBreakoutService()

    def evaluate_structure(
        self,
        ohlc_data: Dict[str, Any],
        indicators: Optional[Dict[str, Any]] = None
    ) -> MarketStructureState:
        """
        Evaluate the market structure using the Decision Matrix logic.
        
        Priority Rules:
        1. Failed Breakout Overrides Accumulation
        2. Accumulation Requires NO Failure Signal
        3. Neutral Is the Default
        """
        try:
            # 1. Detect Failure Signals (Failed Breakouts)
            failed_breakouts = self.failed_breakout_service.detect_failed_breakouts(
                ohlc_data, indicators
            )
            
            # 2. Detect Accumulation Zones
            # We treat "sideways" or "unknown" as context for now, or infer from indicators
            trend_context = "unknown"
            if indicators and indicators.get("price_trend"):
                 trend_context = indicators.get("price_trend")
                 
            accumulation_zones = self.accumulation_service.detect_zones(
                ohlc_data, trend_context=trend_context
            )
            
            # --- Decision Matrix Logic ---
            
            # Rule 1: Failed Breakout Overrides Accumulation
            # We look for the MOST RECENT significant event
            # Use the last detected failed breakout if it's recent enough to matter
            latest_failure = failed_breakouts[-1] if failed_breakouts else None
            latest_accumulation = accumulation_zones[-1] if accumulation_zones else None
            
            # Simple arbitration based on presence first
            if latest_failure:
                # If we have a failed breakout, we check if it's "fresh" or dominant
                # For MVP, presence of a valid failed breakout signal overrides accumulation
                # because "Failed Breakout" implies a trap was set and sprung, invalidating simple accumulation.
                return self._create_failed_breakout_state(latest_failure)
                
            if latest_accumulation:
                return self._create_accumulation_state(latest_accumulation)
                
            # Rule 3: Neutral Default
            return MarketStructureState(
                bias="NEUTRAL",
                confidence="High",
                explanation="No clear edge detected. Market is in neutral consolidation.",
                details={"reason": "No accumulation or failed breakout patterns found."}
            )
            
        except Exception as e:
            logger.error(f"Error evaluating market structure: {str(e)}")
            return MarketStructureState(
                bias="NEUTRAL",
                confidence="Low",
                explanation="Error evaluating market structure.",
                details={"error": str(e)}
            )

    def _create_failed_breakout_state(self, event: Dict[str, Any]) -> MarketStructureState:
        # Map tone: "Rejection", "Trap", "Lack of commitment"
        summary = event.get("summary", "Failed Breakout detected")
        confidence = event.get("confidence", "Low")
        
        explanation = f"Bearish signaling. Price failed to follow through, suggesting a buyer trap."
        if event.get("direction") == "down":
             explanation = f"Bullish signaling. Price failed to follow through, suggesting a seller trap."

        return MarketStructureState(
            bias="FAILED_BREAKOUT",
            confidence=confidence,
            explanation=explanation,
            details={"event": event}
        )

    def _create_accumulation_state(self, zone: Dict[str, Any]) -> MarketStructureState:
        # Map tone: "Absorption", "Patience", "No urgency"
        summary = zone.get("summary", "Accumulation detected")
        confidence = zone.get("confidence", "Low")
        
        explanation = "Constructive action. Price leads with steady absorption, suggesting accumulation."
        
        return MarketStructureState(
            bias="ACCUMULATION",
            confidence=confidence,
            explanation=explanation,
            details={"zone": zone}
        )
