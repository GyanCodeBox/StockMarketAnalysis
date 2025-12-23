"""
Rule-based candle explanation service for MVP
"""
from dataclasses import dataclass
from typing import List, Optional, Dict, Any


@dataclass
class CandleContext:
    open: float
    high: float
    low: float
    close: float
    volume_bucket: str  # low | avg | high
    trend: str  # up | down | range | unknown
    near_level: str  # support | resistance | none
    level_price: Optional[float] = None
    gap: str = "none"  # none | up | down
    news_flag: bool = False
    prev_high: Optional[float] = None
    prev_low: Optional[float] = None


class CandleExplainer:
    @staticmethod
    def explain(ctx: CandleContext) -> Dict[str, Any]:
        summary, flags = CandleExplainer._classify(ctx)
        context_items = CandleExplainer._build_context(ctx, flags)
        interpretation = CandleExplainer._interpret(summary, ctx, flags)
        watch = CandleExplainer._what_to_watch(ctx, flags)
        confidence = CandleExplainer._confidence(ctx, flags)

        return {
            "summary": summary,
            "context": context_items,
            "interpretation": interpretation,
            "what_to_watch": watch,
            "confidence": confidence,
        }

    @staticmethod
    def _classify(ctx: CandleContext):
        o, h, l, c = ctx.open, ctx.high, ctx.low, ctx.close
        rng = max(h - l, 1e-6)
        body = abs(c - o)
        body_pct = body / rng
        upper_wick = h - max(o, c)
        lower_wick = min(o, c) - l
        wick_ratio_up = upper_wick / (body + 1e-6)
        wick_ratio_down = lower_wick / (body + 1e-6)

        is_bull = c > o
        is_bear = c < o

        flags = {
            "long_upper": wick_ratio_up > 1.2 and upper_wick / rng > 0.35,
            "long_lower": wick_ratio_down > 1.2 and lower_wick / rng > 0.35,
            "doji": body_pct < 0.15,
            "strong": body_pct > 0.6,
            "near_level": ctx.near_level != "none",
        }

        # Breakout / failed breakout checks near level
        breakout = None
        failed_breakout = None
        if ctx.near_level == "resistance" and ctx.level_price:
            if c > ctx.level_price and body_pct > 0.4:
                breakout = "breakout_up"
            if ctx.level_price and c < ctx.level_price and flags["long_upper"]:
                failed_breakout = "failed_up"
        if ctx.near_level == "support" and ctx.level_price:
            if c < ctx.level_price and body_pct > 0.4:
                breakout = "breakout_down"
            if ctx.level_price and c > ctx.level_price and flags["long_lower"]:
                failed_breakout = "failed_down"

        if breakout:
            flags["breakout"] = breakout
        if failed_breakout:
            flags["failed_breakout"] = failed_breakout

        # Inside candle detection if prior high/low provided
        if ctx.prev_high is not None and ctx.prev_low is not None:
            flags["inside"] = h <= ctx.prev_high and l >= ctx.prev_low

        if flags.get("doji"):
            return ("Indecision candle (doji)", flags)
        if flags.get("breakout"):
            if flags["breakout"] == "breakout_up":
                return ("Breakout candle through resistance", flags)
            return ("Breakdown candle through support", flags)
        if flags.get("failed_breakout"):
            if flags["failed_breakout"] == "failed_up":
                return ("Failed breakout; sellers rejected higher levels", flags)
            return ("Failed breakdown; buyers defended lower levels", flags)
        if flags.get("inside"):
            return ("Inside candle within previous range", flags)
        if flags["long_upper"] and is_bear:
            return ("Bearish rejection with long upper wick", flags)
        if flags["long_lower"] and is_bull:
            return ("Bullish absorption with long lower wick", flags)
        if flags["strong"] and is_bull:
            return ("Strong bullish candle", flags)
        if flags["strong"] and is_bear:
            return ("Strong bearish candle", flags)

        if is_bull:
            return ("Mild bullish candle", flags)
        if is_bear:
            return ("Mild bearish candle", flags)
        return ("Neutral candle", flags)

    @staticmethod
    def _build_context(ctx: CandleContext, flags) -> List[str]:
        items = []
        if ctx.near_level != "none" and ctx.level_price is not None:
            direction = "resistance" if ctx.near_level == "resistance" else "support"
            items.append(f"Near {direction} ₹{ctx.level_price}")
        if ctx.volume_bucket == "high":
            items.append("Volume above recent average")
        elif ctx.volume_bucket == "low":
            items.append("Volume below recent average")
        if ctx.trend in ("up", "down", "range"):
            labels = {"up": "uptrend", "down": "downtrend", "range": "range-bound"}
            items.append(f"Context: {labels[ctx.trend]}")
        if ctx.gap != "none":
            gap_text = "Gap up" if ctx.gap == "up" else "Gap down"
            items.append(f"{gap_text} into this candle")
        if flags.get("inside"):
            items.append("Contained inside previous candle range")
        if ctx.news_flag:
            items.append("News-driven session (interpret with caution)")
        return items or ["No notable contextual factors"]

    @staticmethod
    def _interpret(summary: str, ctx: CandleContext, flags) -> str:
        if "Breakout" in summary or "Breakdown" in summary:
            return "Momentum attempt at the level; look for follow-through or immediate failure."
        if "Failed breakout" in summary or "Failed breakdown" in summary:
            return "Attempt was rejected; bias shifts opposite the failed direction, but needs confirmation."
        if flags.get("doji"):
            return "Balance between buyers and sellers; wait for the next candle to set direction."
        if flags.get("long_upper"):
            return "Supply showed up at higher levels; upside needs confirmation."
        if flags.get("long_lower"):
            return "Demand stepped in at lower levels; downside needs confirmation."
        if "Strong bullish" in summary:
            return "Buyers in control; watch if strength holds above mid-body."
        if "Strong bearish" in summary:
            return "Sellers in control; watch if weakness holds below mid-body."
        return "Modest move; weight this candle alongside broader structure."

    @staticmethod
    def _what_to_watch(ctx: CandleContext, flags) -> List[str]:
        watch = []
        mid_body = (ctx.open + ctx.close) / 2
        watch.append(f"Hold above ₹{round(mid_body, 2)}" if ctx.close >= ctx.open else f"Stay below ₹{round(mid_body, 2)}")
        if ctx.level_price:
            if ctx.near_level == "resistance":
                watch.append(f"Behavior around ₹{ctx.level_price} resistance")
            elif ctx.near_level == "support":
                watch.append(f"Behavior around ₹{ctx.level_price} support")
        if flags.get("breakout"):
            watch.append("Need follow-up volume to validate breakout")
        if flags.get("failed_breakout"):
            watch.append("Confirm rejection with continuation next candle")
        if flags.get("doji"):
            watch.append("Next candle direction will set bias")
        if ctx.volume_bucket == "low":
            watch.append("Low conviction due to light volume")
        return watch

    @staticmethod
    def _confidence(ctx: CandleContext, flags) -> str:
        score = 1
        if flags.get("strong"):
            score += 1
        if ctx.volume_bucket == "high":
            score += 1
        if ctx.volume_bucket == "low":
            score -= 1
        if flags.get("doji"):
            score -= 1
        if flags.get("inside"):
            score -= 1
        if ctx.news_flag:
            score -= 1

        if score >= 3:
            return "High"
        if score <= 0:
            return "Low"
        return "Medium"

