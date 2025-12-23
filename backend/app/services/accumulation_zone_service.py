"""
Rule-based accumulation zone detector for MVP.
"""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import statistics
import math
import logging

logger = logging.getLogger(__name__)


@dataclass
class AccumulationZone:
    zone_high: float
    zone_low: float
    start_time: Any
    end_time: Any
    duration: int
    confidence: str
    score: float
    summary: str
    characteristics: List[str]
    interpretation: str
    what_to_watch: List[str]
    failure_signals: List[str]


class AccumulationZoneService:
    """
    Lightweight, deterministic accumulation zone detector intended for UX validation.
    """

    def __init__(
        self,
        min_duration: int = 8,
        max_duration: int = 20,
        compression_threshold: float = 0.06,
        strong_compression_threshold: float = 0.045,
        volume_floor_ratio: float = 0.5,
        upper_wick_dominance_cutoff: float = 0.55,
        lower_wick_signal_ratio: float = 1.2,
        prior_trend_lookback: int = 15,
        strong_uptrend_pct: float = 0.08,
    ):
        self.min_duration = min_duration
        self.max_duration = max_duration
        self.compression_threshold = compression_threshold
        self.strong_compression_threshold = strong_compression_threshold
        self.volume_floor_ratio = volume_floor_ratio
        self.upper_wick_dominance_cutoff = upper_wick_dominance_cutoff
        self.lower_wick_signal_ratio = lower_wick_signal_ratio
        self.prior_trend_lookback = prior_trend_lookback
        self.strong_uptrend_pct = strong_uptrend_pct

    def detect_zones(
        self,
        ohlc_data: Dict[str, Any],
        lookback: int = 60,
        trend_context: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Detect accumulation zones using heuristic rules.

        Returns a list of dicts ready for JSON serialization.
        """
        try:
            candles = self._normalize(ohlc_data.get("data", []))
            if len(candles) < self.min_duration + 2:
                return []

            lookback_candles = candles[-lookback:] if lookback > 0 else candles
            vol_median = self._safe_median([c["volume"] for c in lookback_candles])
            vol_p90 = self._percentile([c["volume"] for c in lookback_candles], 0.9)

            candidates: List[AccumulationZone] = []
            idx = 0
            while idx + self.min_duration <= len(candles):
                best_window: Optional[Tuple[int, int, AccumulationZone]] = None
                for dur in range(self.min_duration, self.max_duration + 1):
                    end = idx + dur
                    if end > len(candles):
                        break
                    window = candles[idx:end]
                    zone = self._evaluate_window(
                        window,
                        vol_median,
                        vol_p90,
                        candles,
                        idx,
                        trend_context,
                    )
                    if zone:
                        best_window = (idx, end, zone)
                if best_window:
                    _, end_idx, zone = best_window
                    candidates.append(zone)
                    idx = end_idx  # skip overlapping inside the found zone
                else:
                    idx += 1

            merged = self._merge_overlaps(candidates)
            return [z.__dict__ for z in merged]
        except Exception as exc:
            logger.warning(f"Accumulation zone detection failed: {exc}")
            return []

    def _evaluate_window(
        self,
        window: List[Dict[str, Any]],
        vol_median: float,
        vol_p90: float,
        all_candles: List[Dict[str, Any]],
        start_idx: int,
        trend_context: Optional[str],
    ) -> Optional[AccumulationZone]:
        highs = [c["high"] for c in window]
        lows = [c["low"] for c in window]
        closes = [c["close"] for c in window]
        volumes = [c["volume"] for c in window]

        hi, lo = max(highs), min(lows)
        mid = (hi + lo) / 2 if (hi + lo) else 0
        if mid == 0:
            return None
        range_pct = (hi - lo) / mid
        if range_pct > self.compression_threshold:
            return None

        duration = len(window)
        window_median_vol = self._safe_median(volumes)
        vol_ok = window_median_vol >= vol_median * self.volume_floor_ratio if vol_median > 0 else True

        down_vol_climax = any(
            c["close"] < c["open"] and c["volume"] >= vol_p90 * 1.05 for c in window
        )

        lower_wick_dominance = self._wick_dominance(window, lower=True)
        upper_wick_dominance = self._wick_dominance(window, lower=False)

        prior_slope = self._prior_trend(all_candles, start_idx)
        uptrend_penalty = prior_slope > self.strong_uptrend_pct

        # Distribution filters
        if upper_wick_dominance > self.upper_wick_dominance_cutoff:
            return None
        if uptrend_penalty and trend_context != "downtrend":
            return None
        if down_vol_climax:
            return None

        score = 1.0
        characteristics: List[str] = [
            f"Range compressed {range_pct*100:.1f}% over {duration} bars"
        ]
        if range_pct <= self.strong_compression_threshold:
            score += 1.0
            characteristics.append("Tight compression inside band")
        if vol_ok:
            score += 1.0
            characteristics.append("Volume stable (not collapsing)")
        if lower_wick_dominance >= 0.4:
            score += 1.0
            characteristics.append("Repeated lower-wick absorption")
        if prior_slope < 0:
            score += 0.5
            characteristics.append("Comes after a pullback/down-move")
        if trend_context == "downtrend":
            score += 0.25
        if duration >= self.min_duration + 2:
            score += 0.5

        confidence = "Low"
        if score >= 4.0:
            confidence = "High"
        elif score >= 2.5:
            confidence = "Medium"

        summary = "Signs of accumulation with steady absorption" if confidence != "Low" else "Sideways structure with constructive signs"
        interpretation = "Supply is being absorbed without aggressive selling; bias leans to accumulation."
        if confidence == "Low":
            interpretation = "Neutral consolidation; needs confirmation."

        what_to_watch = [
            "Sustained hold above zone midpoint",
            "Volume expansion on upside attempts",
            "Avoid decisive close below zone low",
        ]
        failure_signals = [
            "Strong close below zone with volume expansion",
            "Upper-wick dominance returning with range expansion",
        ]

        return AccumulationZone(
            zone_high=round(hi, 2),
            zone_low=round(lo, 2),
            start_time=window[0]["time"],
            end_time=window[-1]["time"],
            duration=duration,
            confidence=confidence,
            score=round(score, 2),
            summary=summary,
            characteristics=characteristics,
            interpretation=interpretation,
            what_to_watch=what_to_watch,
            failure_signals=failure_signals,
        )

    def _prior_trend(self, candles: List[Dict[str, Any]], start_idx: int) -> float:
        lookback = max(3, self.prior_trend_lookback)
        if start_idx < 2:
            return 0.0
        start = max(0, start_idx - lookback)
        window = candles[start:start_idx]
        if len(window) < 2:
            return 0.0
        first, last = window[0]["close"], window[-1]["close"]
        if first == 0:
            return 0.0
        return (last - first) / first

    def _wick_dominance(self, window: List[Dict[str, Any]], lower: bool = True) -> float:
        if not window:
            return 0.0
        count = 0
        for c in window:
            body = abs(c["close"] - c["open"])
            if body == 0:
                body = 1e-6
            upper = c["high"] - max(c["open"], c["close"])
            lower_w = min(c["open"], c["close"]) - c["low"]
            if lower and lower_w >= upper * self.lower_wick_signal_ratio and lower_w >= body * 0.3:
                count += 1
            if not lower and upper >= lower_w * self.lower_wick_signal_ratio and upper >= body * 0.3:
                count += 1
        return count / len(window)

    def _merge_overlaps(self, zones: List[AccumulationZone]) -> List[AccumulationZone]:
        if not zones:
            return []
        zones_sorted = sorted(zones, key=lambda z: z.start_time)
        merged: List[AccumulationZone] = []
        for zone in zones_sorted:
            if not merged:
                merged.append(zone)
                continue
            last = merged[-1]
            if zone.start_time <= last.end_time:
                # Merge by expanding bounds and keeping higher confidence
                last.zone_high = max(last.zone_high, zone.zone_high)
                last.zone_low = min(last.zone_low, zone.zone_low)
                last.end_time = max(last.end_time, zone.end_time)
                last.duration = max(last.duration, zone.duration)
                if self._confidence_rank(zone.confidence) > self._confidence_rank(last.confidence):
                    last.confidence = zone.confidence
                    last.summary = zone.summary
                    last.interpretation = zone.interpretation
                    last.characteristics = zone.characteristics
                    last.what_to_watch = zone.what_to_watch
                    last.failure_signals = zone.failure_signals
                last.score = max(last.score, zone.score)
            else:
                merged.append(zone)
        return merged

    def _confidence_rank(self, label: str) -> int:
        order = {"Low": 0, "Medium": 1, "High": 2}
        return order.get(label, 0)

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

    def _safe_median(self, values: List[float]) -> float:
        vals = [v for v in values if math.isfinite(v)]
        return statistics.median(vals) if vals else 0.0

    def _percentile(self, values: List[float], pct: float) -> float:
        vals = sorted(v for v in values if math.isfinite(v))
        if not vals:
            return 0.0
        k = (len(vals) - 1) * pct
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return vals[int(k)]
        d0 = vals[f] * (c - k)
        d1 = vals[c] * (k - f)
        return d0 + d1


