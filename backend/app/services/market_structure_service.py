"""
Market Structure Decision Matrix Service
Arbitrates between Accumulation, Failed Breakout, and Neutral states based on priority rules.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import logging

from app.services.accumulation_zone_service import AccumulationZoneService, AccumulationZone
from app.services.failed_breakout_service import FailedBreakoutService, FailedBreakoutEvent
from app.services.distribution_zone_service import DistributionZoneService

logger = logging.getLogger(__name__)

@dataclass
class MarketStructureState:
    bias: str  # "ACCUMULATION" | "FAILED_BREAKOUT" | "NEUTRAL" | "DISTRIBUTION"
    confidence: str  # "High" | "Medium" | "Low"
    explanation: str
    details: Dict[str, Any] = field(default_factory=dict)
    transition_narration: Optional[str] = None
    transition: Optional[Dict[str, str]] = None
    regime_history: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "bias": self.bias,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "details": self.details,
            "transition_narration": self.transition_narration,
            "transition": self.transition,
            "regime_history": self.regime_history
        }

class MarketStructureService:
    def __init__(self, use_formalized_logic: bool = True):
        self.accumulation_service = AccumulationZoneService(use_formalized_logic=use_formalized_logic)
        self.failed_breakout_service = FailedBreakoutService()
        self.distribution_service = DistributionZoneService()

    def evaluate_structure(
        self,
        ohlc_data: Dict[str, Any],
        indicators: Optional[Dict[str, Any]] = None,
        previous_bias: Optional[str] = None,
        acc_zones: Optional[List[Dict[str, Any]]] = None,
        dist_zones: Optional[List[Dict[str, Any]]] = None
    ) -> MarketStructureState:
        """
        Evaluate the market structure using the Decision Matrix logic.
        
        Priority Rules:
        1. Failed Breakout Overrides Everything
        2. Distribution Overrides Accumulation
        3. Accumulation Requires NO Failure Signal
        4. Neutral Is the Default
        """
        try:
            # 1. Detect Failure Signals (Failed Breakouts)
            failed_breakouts = self.failed_breakout_service.detect_failed_breakouts(
                ohlc_data, indicators
            )
            
            # 2. Detect Distribution Zones
            distribution_zones = dist_zones
            if distribution_zones is None:
                distribution_zones = self.distribution_service.detect_zones(
                    ohlc_data, indicators
                )

            # 3. Detect Accumulation Zones
            accumulation_zones = acc_zones
            if accumulation_zones is None:
                trend_context = "unknown"
                if indicators and indicators.get("price_trend"):
                     trend_context = indicators.get("price_trend")
                     
                accumulation_zones = self.accumulation_service.detect_zones(
                    ohlc_data, trend_context=trend_context
                )
            
            # --- Decision Matrix Logic ---
            # Now handled by resolve_bias helper for consistency with Regime History
            latest_failure = failed_breakouts[-1] if failed_breakouts else None
            latest_distribution = distribution_zones[-1] if distribution_zones else None
            latest_accumulation = accumulation_zones[-1] if accumulation_zones else None
            
            bias, confidence = self.resolve_bias(
                [latest_accumulation] if latest_accumulation else [],
                [latest_distribution] if latest_distribution else [],
                [latest_failure] if latest_failure else []
            )

            state = None
            if bias == "FAILED_BREAKOUT":
                state = self._create_failed_breakout_state(latest_failure)
            elif bias == "DISTRIBUTION":
                state = self._create_distribution_state(latest_distribution)
            elif bias == "ACCUMULATION":
                state = self._create_accumulation_state(latest_accumulation)
            else:
                 state = self._get_neutral_state(ohlc_data)

            # --- Regime History Generation ---
            from app.services.regime_history_service import RegimeHistoryService
            regime_service = RegimeHistoryService(self)
            state.regime_history = regime_service.generate_history(
                ohlc_data,
                accumulation_zones if accumulation_zones else [],
                distribution_zones if distribution_zones else [],
                failed_breakouts if failed_breakouts else []
            )

            # --- Transition Narration ---
            if previous_bias and previous_bias != state.bias and state.bias != "NEUTRAL":
                state.transition_narration = f"Market structure shifted from {previous_bias.capitalize()} → {state.bias.capitalize()}"
                state.transition = {"from": previous_bias, "to": state.bias}

            return state
            
        except Exception as e:
            logger.error(f"Error evaluating market structure: {str(e)}")
            return MarketStructureState(
                bias="NEUTRAL",
                confidence="Low",
                explanation="Error evaluating market structure.",
                details={"error": str(e)}
            )

    def resolve_bias(
        self,
        active_acc: List[Dict[str, Any]],
        active_dist: List[Dict[str, Any]],
        active_fail: List[Dict[str, Any]]
    ) -> tuple[str, str]:
        """
        Public helper to resolve competing signals for a time slice.
        Priority: Failed Breakout > Distribution > Accumulation > Neutral
        Returns: (bias, confidence)
        """
        if active_fail:
             return "FAILED_BREAKOUT", "High" # Failures are high confidence events
        
        if active_dist:
             # Take the 'strongest' or most recent if multiple
             zone = active_dist[-1]
             return "DISTRIBUTION", zone.get("confidence", "Medium")
             
        if active_acc:
             zone = active_acc[-1]
             return "ACCUMULATION", zone.get("confidence", "Medium")
             
        return "NEUTRAL", "Low"

    def _get_neutral_state(self, ohlc_data: Dict[str, Any]) -> MarketStructureState:
        # Provide some "evidence" for Neutral state hovers
        candles = ohlc_data.get("data", [])[-20:] # Look at last 20
        vols = [float(c.get("volume", 0)) for c in candles]
        highs = [float(c.get("high", 0)) for c in candles]
        lows = [float(c.get("low", 0)) for c in candles]
        
        hi, lo = max(highs) if highs else 0, min(lows) if lows else 0
        mid = (hi + lo) / 2 if (hi + lo) else 0
        comp = (hi - lo) / mid if mid > 0 else 0
        
        # Simple volume ratio vs prior 20
        prior_vols = [float(c.get("volume", 0)) for c in ohlc_data.get("data", [])[-40:-20]]
        avg_curr = sum(vols) / len(vols) if vols else 0
        avg_prior = sum(prior_vols) / len(prior_vols) if prior_vols else avg_curr
        vol_ratio = avg_curr / avg_prior if avg_prior > 0 else 1.0

        return MarketStructureState(
            bias="NEUTRAL",
            confidence="High",
            explanation="No clear edge detected. Market is in neutral consolidation.",
            details={
                "reason": "No accumulation or failed breakout patterns found.",
                "metrics": {
                    "compression_pct": round(comp, 4),
                    "volume_ratio": round(vol_ratio, 2),
                    "duration": len(candles)
                }
            }
        )

    def _create_failed_breakout_state(self, event: Dict[str, Any]) -> MarketStructureState:
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

    def _create_distribution_state(self, zone: Dict[str, Any]) -> MarketStructureState:
        summary = zone.get("summary", "Early distributional behavior; requires confirmation.")
        confidence = zone.get("confidence", "Low")
        
        return MarketStructureState(
            bias="DISTRIBUTION",
            confidence=confidence,
            explanation=summary,
            details={"zone": zone}
        )

    def _create_accumulation_state(self, zone: Dict[str, Any]) -> MarketStructureState:
        summary = zone.get("summary", "Condition present, but confirmation signals are mixed.")
        confidence = zone.get("confidence", "Low")
        
        # Use the summary directly as the explanation for formalized logic consistency
        explanation = summary
        
        return MarketStructureState(
            bias="ACCUMULATION",
            confidence=confidence,
            explanation=explanation,
            details={"zone": zone}
        )
