"""
Service for generating a linear Regime History Timeline.
Stitches point-in-time Market Structure states into continuous regime events.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class RegimeEvent:
    start_time: str
    end_time: str
    bias: str
    confidence: str
    duration: int
    transition_in: Optional[str] = None
    transition_out: Optional[str] = None
    narrative: Optional[str] = None

class RegimeHistoryService:
    def __init__(self, market_structure_service):
        self.market_structure_service = market_structure_service

    def generate_history(
        self,
        ohlc_data: Dict[str, Any],
        acc_zones: List[Dict[str, Any]],
        dist_zones: List[Dict[str, Any]],
        failed_breakouts: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generates a timeline of regime events by slicing time and resolving bias.
        """
        candles = ohlc_data.get("data", [])
        if not candles:
            return []

        # 1. Identify Time Slices
        # We need to evaluate structure at every candle to be precise, 
        # or at least at every zone change. For accuracy, let's iterate candles.
        # Optimized approach: Identify change points from zones.
        
        # Actually, to correctly capture "Neutral" bridges and exact overlaps,
        # checking every candle is safest and not too expensive for < 2000 points.
        
        raw_states = []
        
        # Pre-process zones into quick lookup interval trees or simple lists
        # For MVP, simple list filtration per candle is fine (N*M where M is small)
        
        for i, candle in enumerate(candles):
            date_str = candle.get("time") or candle.get("date")
            if not date_str:
                continue
            # Ensure ISO string if it's a datetime object (Kite often returns datetime objects)
            if isinstance(date_str, datetime):
                date_str = date_str.isoformat()
            
            # Find active candidates for this specific time `i`
            # Note: Zones are usually defined by indices or start/end times.
            # Assuming zones have 'start_time' and 'end_time' ISO strings.
            
            def to_str(val):
                if isinstance(val, datetime):
                    return val.isoformat()
                return val

            # Find active candidates for this specific time `i`
            active_acc = [z for z in acc_zones if to_str(z["start_time"]) <= date_str <= to_str(z["end_time"])]
            active_dist = [z for z in dist_zones if to_str(z["start_time"]) <= date_str <= to_str(z["end_time"])]
            
            # Failed Breakouts are often single points or short ranges
            active_fail = []
            for f in failed_breakouts:
                f_fail_time = to_str(f.get("failure_time"))
                f_start = to_str(f.get("start_time") or f.get("breakout_time") or f_fail_time)
                f_end = to_str(f.get("end_time") or f_fail_time or f_start)
                
                if f_fail_time == date_str:
                    active_fail.append(f)
                elif f_start and f_end and f_start <= date_str <= f_end:
                    active_fail.append(f)

            # Resolve Bias for this single slice
            bias, confidence = self.market_structure_service.resolve_bias(
                active_acc, active_dist, active_fail
            )
            
            raw_states.append({
                "time": date_str,
                "bias": bias,
                "confidence": confidence,
                "index": i
            })

        # 2. Compress (Stitch) into Events
        events = self._compress_states(raw_states)
        
        return [asdict(e) for e in events]

    def _compress_states(self, raw_states: List[Dict[str, Any]]) -> List[RegimeEvent]:
        if not raw_states:
            return []

        events = []
        current_event = None

        for state in raw_states:
            bias = state["bias"]
            conf = state["confidence"]
            time = state["time"]

            if current_event is None:
                current_event = RegimeEvent(
                    start_time=time,
                    end_time=time,
                    bias=bias,
                    confidence=conf,
                    duration=1
                )
                continue

            # Stitching Logic
            should_stitch = (
                bias == current_event.bias
                and bias != "FAILED_BREAKOUT" # Never stitch failed breakouts (allow them to define their own short duration)
                # and conf == current_event.confidence # Optional: Split on confidence change? User said "Confidence change alone does NOT create new event"
            )

            if should_stitch:
                current_event.end_time = time
                current_event.duration += 1
            else:
                # Close current
                self._finalize_event(current_event, next_bias=bias)
                events.append(current_event)
                
                # Start new
                current_event = RegimeEvent(
                    start_time=time,
                    end_time=time,
                    bias=bias,
                    confidence=conf,
                    duration=1,
                    transition_in=current_event.bias # Previous bias
                )

        if current_event:
            self._finalize_event(current_event, next_bias=None)
            events.append(current_event)

        return events

    def _finalize_event(self, event: RegimeEvent, next_bias: Optional[str]):
        event.transition_out = next_bias
        # Generate narrative (MVP stub)
        if event.bias == "NEUTRAL":
            event.narrative = "Market lacked clear directional structure."
        elif event.bias == "ACCUMULATION":
            event.narrative = f"Price consolidated in demand zone for {event.duration} bars."
        elif event.bias == "DISTRIBUTION":
            event.narrative = f"Supply dominated price action for {event.duration} bars."
        elif event.bias == "FAILED_BREAKOUT":
            event.narrative = "Attempted breakout triggered sudden reversal."
