from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import logging
from enum import Enum
import statistics

logger = logging.getLogger(__name__)

class DistributionRejectionReason(Enum):
    COMPRESSION_TOO_WIDE = "Range compression exceeds 5% tolerance"
    VOLUME_COLLAPSE = "Volume collapsed uniformly (suggests pause, not distribution)"
    LOW_SCORE = "Signal alignment points below threshold"
    UPSIDE_ACCEPTANCE = "Sustained upside acceptance above zone high"
    NO_UPPER_WICK_REJECTION = "Absence of upper-wick rejection signals"
    PRECONDITION_FAILED = "Insufficient prior advance or below long-term mean"

@dataclass
class DistributionZone:
    start_time: Any
    end_time: Any
    duration: int
    compression_pct: float
    confidence: str
    score: int
    summary: str
    characteristics: List[str]
    interpretation: str
    what_to_watch: List[str]
    failure_signals: List[str]
    metrics: Dict[str, Any] = field(default_factory=dict)

class DistributionZoneService:
    def __init__(
        self,
        min_duration: int = 8,
        max_duration: int = 25,
        ideal_compression: float = 0.04,
        compression_tolerance: float = 0.05,
        volume_ratio_threshold: float = 0.8,
        upper_wick_ratio: float = 0.35,
        close_position_bias: float = 0.55,
        prior_advance_threshold: float = 0.20,
        lookback: int = 40,
    ):
        self.min_duration = min_duration
        self.max_duration = max_duration
        self.ideal_compression = ideal_compression
        self.compression_tolerance = compression_tolerance
        self.volume_ratio_threshold = volume_ratio_threshold
        self.upper_wick_ratio = upper_wick_ratio
        self.close_position_bias = close_position_bias
        self.prior_advance_threshold = prior_advance_threshold
        self.lookback = lookback
        
        # Timeframe Profiles
        self.TIMEFRAME_PROFILES = {
            "day": {"compression_tolerance": 0.05, "min_duration": 8, "precondition_window": 60},
            "week": {"compression_tolerance": 0.12, "min_duration": 6, "precondition_window": 30},
            "hour": {"compression_tolerance": 0.05, "min_duration": 8, "precondition_window": 60},
            "15minute": {"compression_tolerance": 0.04, "min_duration": 8, "precondition_window": 60},
            "5minute": {"compression_tolerance": 0.04, "min_duration": 8, "precondition_window": 60},
        }

    def detect_zones(
        self,
        ohlc_data: Dict[str, Any],
        indicators: Optional[Dict[str, Any]] = None,
        timeframe: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        try:
            candles = self._normalize(ohlc_data.get("data", []))
            interval = timeframe or ohlc_data.get("interval", "day")
            profile = self.TIMEFRAME_PROFILES.get(interval, self.TIMEFRAME_PROFILES["day"])
            
            precondition_window = profile["precondition_window"]
            if len(candles) < precondition_window:
                return []
            
            # 1. Eligibility Preconditions
            if not self._check_preconditions(candles, indicators, profile):
                return []
            
            comp_tolerance = profile["compression_tolerance"]
            min_dur = profile["min_duration"]

            zones: List[DistributionZone] = []
            n = len(candles)
            scan_end = n
            scan_start = max(0, n - self.lookback - self.max_duration)

            for end_idx in range(n, n - self.lookback, -1):
                for duration in range(self.max_duration, min_dur - 1, -1):
                    start_idx = end_idx - duration
                    if start_idx < 0:
                        continue
                    
                    window = candles[start_idx:end_idx]
                    prior_window = candles[max(0, start_idx - duration):start_idx]
                    
                    if not prior_window:
                        continue
                        
                    zone = self._evaluate_window(window, prior_window, comp_tolerance)
                    if zone:
                        zones.append(zone)
                        break # Found best/longest for this end point
            
            # Merge overlapping zones (simpler logic for MVP)
            merged = self._merge_zones(zones)
            return [z.__dict__ for z in merged]

        except Exception as exc:
            logger.warning(f"Distribution detection failed: {exc}")
            return []

    def _check_preconditions(self, candles: List[Dict[str, Any]], indicators: Optional[Dict[str, Any]], profile: Dict[str, Any]) -> bool:
        # A. Prior Advance Exist (+20% over lookback candles)
        # Use profile-specific lookback
        pre_window = profile["precondition_window"]
        curr_price = candles[-1]["close"]
        price_start = candles[-pre_window]["close"]
        price_change = (curr_price - price_start) / price_start
        
        if price_change < self.prior_advance_threshold:
            # Check for structural HH/HL if change is lower? For MVP, stick to % change
            # Actually, let's check SMA 200 if change is borderline or as primary
            pass

        # B. Price Above Long-Term Mean (SMA 200)
        # If indicators provide it, use it. Otherwise, calculate.
        sma_200 = indicators.get("sma_200") if indicators else None
        if sma_200 is None and len(candles) >= 200:
            sma_200 = statistics.mean([c["close"] for c in candles[-200:]])
        
        # Precondition Rule:
        if price_change < self.prior_advance_threshold:
            self._log_rejection(DistributionRejectionReason.PRECONDITION_FAILED, f"Prior advance {price_change:.1%} < {self.prior_advance_threshold:.0%}")
            return False
            
        if sma_200 and curr_price < sma_200:
            self._log_rejection(DistributionRejectionReason.PRECONDITION_FAILED, f"Price {curr_price} below SMA 200 ({sma_200:.2f})")
            return False
            
        return True

    def _evaluate_window(self, window: List[Dict[str, Any]], prior_window: List[Dict[str, Any]], compression_tolerance: float) -> Optional[DistributionZone]:
        closes = [c["close"] for c in window]
        highs = [c["high"] for c in window]
        lows = [c["low"] for c in window]
        vols = [c["volume"] for c in window]
        
        zone_high = max(highs)
        zone_low = min(lows)
        zone_mid = (zone_high + zone_low) / 2
        duration = len(window)
        
        # 1. Price Compression
        compression_pct = (zone_high - zone_low) / zone_mid
        if compression_pct > compression_tolerance:
            self._log_rejection(DistributionRejectionReason.COMPRESSION_TOO_WIDE, f"{compression_pct:.1%} > {compression_tolerance:.1%}")
            return None
            
        # 2. Volume Behavior (Mirror)
        avg_prior_vol = statistics.mean([c["volume"] for c in prior_window])
        avg_zone_vol = statistics.mean(vols)
        volume_ratio = avg_zone_vol / avg_prior_vol if avg_prior_vol > 0 else 1.0
        
        # Distribution likes churn (stable high volume)
        if volume_ratio < self.volume_ratio_threshold:
            self._log_rejection(DistributionRejectionReason.VOLUME_COLLAPSE, f"Ratio {volume_ratio:.2f} < {self.volume_ratio_threshold}")
            return None

        # 3. Scoring (Signal Alignment Model)
        score = 0
        characteristics = []
        
        if compression_pct <= self.ideal_compression:
            score += 2
            characteristics.append(f"Tight compression ({compression_pct:.1%})")
        else:
            characteristics.append(f"Compression within tolerance ({compression_pct:.1%})")
            
        if 8 <= duration <= 25:
            score += 1
            
        if volume_ratio >= 0.8:
            score += 2
            characteristics.append("Active volume churn (supply presence)")
            
        # 4. Inverted Wick Dominance (Upper)
        upper_wick_count = 0
        for c in window:
            rng = max(c["high"] - c["low"], 1e-6)
            upper_wick = c["high"] - max(c["open"], c["close"])
            if upper_wick / rng >= self.upper_wick_ratio:
                upper_wick_count += 1
        
        if upper_wick_count >= 2:
            score += 1
            characteristics.append("Repeated upper-wick supply rejection")
        else:
            self._log_rejection(DistributionRejectionReason.NO_UPPER_WICK_REJECTION, f"Only {upper_wick_count} wicks")
            return None # CRITICAL for Distribution

        # 5. Inverted Close Position Bias (Lower)
        low_closes = 0
        for c in window:
            rng = max(c["high"] - c["low"], 1e-6)
            pos = (c["close"] - c["low"]) / rng
            if pos <= self.close_position_bias:
                low_closes += 1
                
        if low_closes / duration >= 0.5:
            score += 1
            characteristics.append("Weak close positioning (supply dominance)")
        
        # 6. Reject if Sustained Upside Acceptance (Bullish Absorption)
        # If the last 3 closes are significantly above the zone high, it's a breakout/absorption
        if max(closes[-3:]) > zone_high * 1.002:
            self._log_rejection(DistributionRejectionReason.UPSIDE_ACCEPTANCE, f"Last closes {max(closes[-3:])} > {zone_high * 1.002:.2f}")
            return None
            
        if score < 3:
            self._log_rejection(DistributionRejectionReason.LOW_SCORE, f"Score {score} < 3")
            return None
            
        # Confidence Mapping
        if score >= 6: confidence = "High"
        elif score >= 4: confidence = "Medium"
        else: confidence = "Low"
        
        summary = self._get_summary(confidence)
        
        return DistributionZone(
            start_time=window[0]["time"],
            end_time=window[-1]["time"],
            duration=duration,
            compression_pct=round(compression_pct, 4),
            confidence=confidence,
            score=score,
            summary=summary,
            characteristics=characteristics,
            interpretation="Supply is being distributed into strength rather than absorbed. Price is holding range, but upside attempts are repeatedly rejected, indicating seller presence.",
            what_to_watch=[
                "Sustained acceptance above zone high (invalidates distribution)",
                "Continued upper-wick rejection near highs",
                "Volume expansion on downside attempts"
            ],
            failure_signals=[
                "Strong closes above zone high with volume",
                "Absence of upper-wick rejection",
                "Transition back to absorption behavior"
            ],
            metrics={
                "compression_pct": round(compression_pct, 4),
                "duration": duration,
                "volume_ratio": round(volume_ratio, 2),
                "upper_wick_count": upper_wick_count
            }
        )

    def _get_summary(self, confidence: str) -> str:
        if confidence == "High":
            return "Repeated supply rejection during compression after an advance."
        if confidence == "Medium":
            return "Compression present, but supply signals are mixed."
        return "Early distributional behavior; requires confirmation."

    def _merge_zones(self, zones: List[DistributionZone]) -> List[DistributionZone]:
        if not zones: return []
        zones.sort(key=lambda x: x.end_time)
        return [zones[-1]] # For MVP, return the latest valid zone

    def _log_rejection(self, reason: DistributionRejectionReason, detail: str):
        logger.debug(f"[Distribution Rejected] {reason.value}: {detail}")

    def _normalize(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned = []
        for row in data:
            try:
                cleaned.append({
                    "open": float(row.get("open", 0)),
                    "high": float(row.get("high", 0)),
                    "low": float(row.get("low", 0)),
                    "close": float(row.get("close", 0)),
                    "volume": float(row.get("volume", 0)),
                    "time": row.get("date") or row.get("time") or row.get("timestamp")
                })
            except: continue
        return cleaned
