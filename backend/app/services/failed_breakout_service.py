"""
Rule-based failed breakout detection for MVP.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import math
import statistics
import logging

logger = logging.getLogger(__name__)


@dataclass
class FailedBreakoutEvent:
    direction: str  # "up" | "down"
    breakout_level: float
    breakout_time: Any
    failure_time: Any
    failure_type: str
    summary: str
    context: List[str]
    what_to_watch: List[str]
    confidence: str


class FailedBreakoutService:
    """
    Lightweight detector for failed breakouts around recent support/resistance.
    Focused on last breakout attempts for UX / learning, not exhaustive backtest.
    """

    def __init__(
        self,
        lookback: int = 80,
        base_window: int = 30,
        min_breakout_range_pct: float = 0.01,
        reentry_window: int = 3,
    ):
        self.lookback = lookback
        self.base_window = base_window
        self.min_breakout_range_pct = min_breakout_range_pct
        self.reentry_window = reentry_window

    def detect_failed_breakouts(
        self,
        ohlc_data: Dict[str, Any],
        indicators: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        try:
            candles = self._normalize(ohlc_data.get("data", []))
            if len(candles) < self.base_window + 5:
                return []

            recent = candles[-self.lookback :] if self.lookback > 0 else candles

            closes = [c["close"] for c in recent]
            highs = [c["high"] for c in recent]
            lows = [c["low"] for c in recent]
            volumes = [c["volume"] for c in recent]

            base_end = max(self.base_window, len(recent) // 2)
            base_closes = closes[:base_end]
            base_highs = highs[:base_end]
            base_lows = lows[:base_end]
            base_vol = volumes[:base_end]

            if not base_highs or not base_lows:
                return []

            resistance = max(base_highs)
            support = min(base_lows)
            avg_range = self._avg_range(base_highs, base_lows)
            avg_vol = self._safe_mean(base_vol)

            events: List[FailedBreakoutEvent] = []

            # Scan for upside failed breakout
            up_event = self._scan_failed_breakout(
                direction="up",
                recent=recent,
                resistance=resistance,
                support=support,
                avg_range=avg_range,
                avg_vol=avg_vol,
            )
            if up_event:
                events.append(up_event)

            # Scan for downside failed breakout
            down_event = self._scan_failed_breakout(
                direction="down",
                recent=recent,
                resistance=resistance,
                support=support,
                avg_range=avg_range,
                avg_vol=avg_vol,
            )
            if down_event:
                events.append(down_event)

            return [e.__dict__ for e in events]
        except Exception as exc:
            logger.warning(f"Failed breakout detection error: {exc}")
            return []

    def _scan_failed_breakout(
        self,
        direction: str,
        recent: List[Dict[str, Any]],
        resistance: float,
        support: float,
        avg_range: float,
        avg_vol: float,
    ) -> Optional[FailedBreakoutEvent]:
        n = len(recent)
        if n < 5 or avg_range <= 0:
            return None

        breakout_idx = None
        level = resistance if direction == "up" else support

        # Find latest breakout candidate
        for i in range(self.base_window, n):
            c = recent[i]
            if direction == "up":
                if c["close"] > level and (c["close"] - level) >= avg_range * self.min_breakout_range_pct:
                    breakout_idx = i
            else:
                if c["close"] < level and (level - c["close"]) >= avg_range * self.min_breakout_range_pct:
                    breakout_idx = i

        if breakout_idx is None:
            return None

        breakout_candle = recent[breakout_idx]

        # Evaluate failure over next N candles
        reentry = False
        vol_fail = False
        wick_reject = False
        no_follow_through = False
        counter_candle = False

        window_end = min(n, breakout_idx + 1 + self.reentry_window)
        after = recent[breakout_idx:window_end]

        # Re-entry into prior range
        for c in after:
            if direction == "up" and c["close"] < level:
                reentry = True
            if direction == "down" and c["close"] > level:
                reentry = True

        # Volume failure: breakout vol <= average
        if breakout_candle["volume"] <= avg_vol:
            vol_fail = True

        # Wick rejection on breakout candle
        o, h, l, c = (
            breakout_candle["open"],
            breakout_candle["high"],
            breakout_candle["low"],
            breakout_candle["close"],
        )
        rng = max(h - l, 1e-6)
        body = abs(c - o)
        upper = h - max(o, c)
        lower = min(o, c) - l
        if direction == "up":
            wick_reject = upper / (body + 1e-6) > 1.2 and upper / rng > 0.35
        else:
            wick_reject = lower / (body + 1e-6) > 1.2 and lower / rng > 0.35

        # Lack of follow-through: Only valid if there ARE later candles
        later = recent[breakout_idx + 1 : window_end]
        if later:
            if direction == "up":
                no_follow_through = not any(c2["close"] > breakout_candle["close"] for c2 in later)
            else:
                no_follow_through = not any(c2["close"] < breakout_candle["close"] for c2 in later)
        else:
            # Fresh breakout (latest candle) cannot have "failed follow through" yet
            no_follow_through = False

        # Opposite pressure candle soon after
        for c2 in later:
            body2 = abs(c2["close"] - c2["open"])
            strong = body2 / (max(c2["high"] - c2["low"], 1e-6)) > 0.6
            if direction == "up" and c2["close"] < c2["open"] and strong:
                counter_candle = True
            if direction == "down" and c2["close"] > c2["open"] and strong:
                counter_candle = True

        confirmations = [reentry, vol_fail, wick_reject, no_follow_through, counter_candle]
        score = sum(1 for f in confirmations if f)
        if score < 2:
            return None

        failure_type = self._classify_failure(direction, reentry, vol_fail, wick_reject, no_follow_through, counter_candle)
        summary = (
            "Upside breakout attempt failed with rejection."
            if direction == "up"
            else "Downside breakout attempt failed with rejection."
        )

        context: List[str] = []
        context.append(f"Breakout {'above' if direction == 'up' else 'below'} level ₹{round(level, 2)}")
        if vol_fail:
            context.append("Breakout volume did not expand vs recent average")
        if reentry:
            context.append("Price quickly closed back inside prior range")
        if wick_reject:
            context.append("Long wick against breakout direction, showing rejection")
        if no_follow_through:
            context.append("No follow-through closes beyond breakout candle")
        if counter_candle:
            context.append("Strong opposite-direction candle appeared soon after")

        what_to_watch = [
            f"Acceptance {'below' if direction == 'up' else 'above'} ₹{round(level, 2)}",
            "Behavior around prior range midpoint",
        ]
        if direction == "up":
            what_to_watch.append("Watch for downside volume pickup confirming trap")
        else:
            what_to_watch.append("Watch for upside volume pickup confirming short trap")

        if score >= 4:
            confidence = "High"
        elif score == 3:
            confidence = "Medium"
        else:
            confidence = "Low"

        failure_candle = after[-1]

        return FailedBreakoutEvent(
            direction=direction,
            breakout_level=round(level, 2),
            breakout_time=breakout_candle["time"],
            failure_time=failure_candle["time"],
            failure_type=failure_type,
            summary=summary,
            context=context,
            what_to_watch=what_to_watch,
            confidence=confidence,
        )

    def _classify_failure(
        self,
        direction: str,
        reentry: bool,
        vol_fail: bool,
        wick_reject: bool,
        no_follow_through: bool,
        counter_candle: bool,
    ) -> str:
        if wick_reject and reentry:
            return "immediate_rejection"
        if counter_candle and reentry:
            return "trap_reversal"
        if vol_fail and no_follow_through:
            return "low_volume_fakeout"
        return "generic_failure"

    def _normalize(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned: List[Dict[str, Any]] = []
        for row in data:
            if not isinstance(row, dict):
                continue
            try:
                open_p = float(row.get("open") or row.get("Open") or 0)
                high_p = float(row.get("high") or row.get("High") or 0)
                low_p = float(row.get("low") or row.get("Low") or 0)
                close_p = float(row.get("close") or row.get("Close") or 0)
                volume = float(row.get("volume") or row.get("Volume") or 0)
                time_val = row.get("date") or row.get("time") or row.get("timestamp")
                if not time_val:
                    continue
                cleaned.append(
                    {
                        "open": open_p,
                        "high": high_p,
                        "low": low_p,
                        "close": close_p,
                        "volume": volume,
                        "time": time_val,
                    }
                )
            except Exception:
                continue
        return cleaned

    def _avg_range(self, highs: List[float], lows: List[float]) -> float:
        if not highs or not lows or len(highs) != len(lows):
            return 0.0
        ranges = [h - l for h, l in zip(highs, lows)]
        vals = [r for r in ranges if math.isfinite(r)]
        return statistics.mean(vals) if vals else 0.0

    def _safe_mean(self, values: List[float]) -> float:
        vals = [v for v in values if math.isfinite(v)]
        return statistics.mean(vals) if vals else 0.0


