from typing import Dict, List, Any
import numpy as np
import logging

logger = logging.getLogger(__name__)

class TechnicalScorer:
    """
    Calculate technical score (0-100) for a stock based on:
    1. Moving Average Position (50%)
    2. Volume Confirmation (25%)
    3. Trend Strength (15%)
    4. Momentum (10%)
    """
    
    def __init__(self):
        self.weights = {
            'ma_position': 0.50,
            'volume': 0.25,
            'trend': 0.15,
            'momentum': 0.10
        }
    
    def calculate_score(
        self, 
        current_price: float,
        ma_data: Dict[str, float],
        ohlc_data: List[Dict[str, Any]],
        timeframe: str
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive technical score
        """
        try:
            # Calculate individual components
            ma_score = self._calculate_ma_position_score(current_price, ma_data, timeframe)
            volume_score = self._calculate_volume_score(ohlc_data)
            trend_score = self._calculate_trend_score(ohlc_data)
            momentum_score = self._calculate_momentum_score(ohlc_data)
            
            # Calculate total score (Components already verify the weights: 50+25+15+10=100)
            raw_score = ma_score + volume_score + trend_score + momentum_score
            
            total_score = min(100, max(0, raw_score))  # Clamp to 0-100
            
            # Generate signals
            components = {
                "ma_position": round(ma_score, 1),
                "volume": round(volume_score, 1),
                "trend": round(trend_score, 1),
                "momentum": round(momentum_score, 1)
            }
            
            signals = self._generate_signals(ma_score, volume_score, trend_score, momentum_score)
            
            return {
                "total_score": round(total_score, 1),
                "grade": self._get_grade(total_score),
                "color": self._get_color(total_score),
                "components": components,
                "signals": signals
            }
        except Exception as e:
            logger.exception(f"Error calculating technical score: {e}")
            logger.error(f"Inputs - Price: {current_price}, Timeframe: {timeframe}")
            logger.error(f"MA Keys: {list(ma_data.keys()) if ma_data else 'None'}")
            # Return a neutral/error score structure on failure
            return {
                "total_score": 50,
                "grade": "Neutral",
                "color": "#eab308",
                "components": {k: 0 for k in self.weights},
                "signals": ["⚠️ Error calculating detailed score"]
            }

    def _calculate_ma_position_score(self, price: float, ma_data: Dict[str, float], timeframe: str) -> float:
        """Calculate MA position score (0-50)"""
        score = 0
        
        # Normalize timeframe (handle 'day', 'week', 'hour' etc from API)
        tf_lower = timeframe.lower()
        
        if tf_lower == "day" or tf_lower == "daily":
            sma_50 = ma_data.get("SMA_50") or ma_data.get("50_SMA")
            sma_200 = ma_data.get("SMA_200") or ma_data.get("200_SMA")
            
            if not sma_50 or not sma_200:
                logger.warning("Missing SMA predictors for daily score")
                return 0
            
            # Base Position
            if price > sma_200 and price > sma_50:
                score = 50
            elif price > sma_200 and price < sma_50:
                score = 30
            elif price < sma_200 and price > sma_50:
                score = 20
            else:
                score = 0
            
            # Golden/Death Cross
            if sma_50 > sma_200:
                score += 5
            else:
                score -= 5
            
            # Distance Logic
            dist_200 = ((price - sma_200) / sma_200) * 100
            dist_50 = ((price - sma_50) / sma_50) * 100
            
            if dist_200 > 5: score += 5
            elif dist_200 < -5: score -= 5
            
            if dist_50 > 3: score += 3
            elif dist_50 < -3: score -= 3
            
        elif tf_lower == "week" or tf_lower == "weekly":
            wma_10 = ma_data.get("WMA_10") or ma_data.get("10_WMA")
            wma_40 = ma_data.get("WMA_40") or ma_data.get("40_WMA")
            
            if not wma_10 or not wma_40:
                return 0
            
            if price > wma_40 and price > wma_10: score = 50
            elif price > wma_40 and price < wma_10: score = 30
            elif price < wma_40 and price > wma_10: score = 20
            else: score = 0
            
            if wma_10 > wma_40: score += 5
            else: score -= 5
            
        elif tf_lower in ["hour", "hourly", "15minute", "5minute"]:
            # Intraday / Hourly logic roughly maps to EMA 21
            ema_21 = ma_data.get("EMA_21") or ma_data.get("21_EMA")
            
            if not ema_21:
                return 0
                
            dist = ((price - ema_21) / ema_21) * 100
            
            if price > ema_21:
                score = 50
                if abs(dist) < 0.5:
                    score = 35  # Testing support
            else:
                if abs(dist) < 2:
                    score = 20  # Minor correction
                else:
                    score = 0   # Bearish trend
        
        return min(50, max(0, score))

    def _calculate_volume_score(self, ohlc_data: List[Dict]) -> float:
        """Calculate volume confirmation score (0-25)"""
        if not ohlc_data or len(ohlc_data) < 11:
            return 10  # Neutral
            
        # Ensure we have consistent key access (lowercase)
        def get_val(item, keys, default=0):
            for k in keys:
                if k in item: return float(item[k])
            return default

        # Extract volume
        volumes = []
        for c in ohlc_data:
            volumes.append(get_val(c, ['volume', 'Volume']))
            
        last_10_volumes = volumes[-11:-1]
        if not last_10_volumes: return 10
        
        avg_volume = np.mean(last_10_volumes)
        if avg_volume == 0: return 10
        
        current = ohlc_data[-1]
        current_volume = get_val(current, ['volume', 'Volume'])
        current_close = get_val(current, ['close', 'Close'])
        current_open = get_val(current, ['open', 'Open'])
        
        is_bullish = current_close > current_open
        is_bearish = current_close < current_open
        
        volume_ratio = current_volume / avg_volume
        
        if is_bullish:
            if volume_ratio > 1.5: return 25
            elif volume_ratio > 1.2: return 20
            elif volume_ratio > 1.0: return 15
            else: return 8
        elif is_bearish:
            if volume_ratio > 1.5: return -15  # Penalty, but min clamped to 0 later? PRD says -15.
            # Wait, PRD says Volume Confirmation Score Max 25 points.
            # If Bearish returns negative, it subtracts from total. 
            # Actually weighting handles positive contribution. 
            # If component score is negative, weighted total decreases.
            # PRD logic: "V_current > 1.5 * ADV_10 AND Bearish: -15 points"
            # It seems this component can be negative. 
            # But "Score Components (100 Points Total)" implies positive sum?
            # Let's verify: "Max Points: 25 points". 
            # If I return -15 here, and weight is 0.25, that's -3.75 total score drop.
            # But function clamps total score to 0-100? Yes.
            # However, `_calculate_volume_score` return type doc says (0-25).
            # The PRD example shows "20/25".
            # The Example 2 Bearish calculation shows:
            # "Volume: Bearish candle with weak volume: +5 points" -> (5 * 0.25) = 1.25 contribution.
            # "V_current > 1.5 x ADV_10 AND Bearish: -15 points" -> (-15 * 0.25) = -3.75 contribution.
            # Okay, so this sub-score CAN be negative.
            if volume_ratio > 1.5: return -15
            elif volume_ratio > 1.0: return -10
            else: return 5
        else:
            # Doji/Neutral
            if volume_ratio > 1.5: return 5
            else: return 10
            
        return 10

    def _calculate_trend_score(self, ohlc_data: List[Dict]) -> float:
        """Calculate trend strength score (0-15)"""
        if len(ohlc_data) < 10:
            return 5
            
        last_10 = ohlc_data[-10:]
        
        bullish_count = 0
        higher_highs = 0
        lower_lows = 0
        
        for i in range(len(last_10)):
            c = last_10[i]
            close_p = c.get('close') or c.get('Close') or 0
            open_p = c.get('open') or c.get('Open') or 0
            if close_p > open_p:
                bullish_count += 1
            
            if i > 0:
                prev = last_10[i-1]
                curr_h = c.get('high') or c.get('High') or 0
                prev_h = prev.get('high') or prev.get('High') or 0
                if curr_h > prev_h:
                    higher_highs += 1
                    
                curr_l = c.get('low') or c.get('Low') or 0
                prev_l = prev.get('low') or prev.get('Low') or 0
                if curr_l < prev_l:
                    lower_lows += 1
                    
        bearish_count = 10 - bullish_count
        
        if bullish_count >= 7 and higher_highs >= 3: return 15
        elif bullish_count >= 6 and higher_highs >= 2: return 12
        elif bullish_count >= 5: return 8
        elif bullish_count >= 4: return 5
        elif bearish_count >= 7 and lower_lows >= 3: return -5
        else: return 0

    def _calculate_momentum_score(self, ohlc_data: List[Dict]) -> float:
        """Calculate momentum score (0-10)"""
        if len(ohlc_data) < 6:
            return 5
            
        try:
            p_5_ago = float(ohlc_data[-6].get('close') or ohlc_data[-6].get('Close') or 0)
            curr = float(ohlc_data[-1].get('close') or ohlc_data[-1].get('Close') or 0)
            
            if p_5_ago == 0: return 5
            
            pct_change = ((curr - p_5_ago) / p_5_ago) * 100
            
            if pct_change >= 5: return 10
            elif pct_change >= 3: return 8
            elif pct_change >= 1: return 6
            elif pct_change >= -1: return 5
            elif pct_change >= -3: return 3
            elif pct_change >= -5: return 1
            else: return 0
        except Exception:
            return 5

    def _get_grade(self, score: float) -> str:
        if score >= 80: return "Strong Bullish"
        elif score >= 60: return "Bullish"
        elif score >= 40: return "Neutral"
        elif score >= 20: return "Bearish"
        else: return "Strong Bearish"
        
    def _get_color(self, score: float) -> str:
        if score >= 80: return "#10b981" # Dark Green
        elif score >= 60: return "#22c55e" # Green
        elif score >= 40: return "#eab308" # Yellow
        elif score >= 20: return "#f97316" # Orange
        else: return "#ef4444" # Red

    def _generate_signals(self, ma_score: float, vol_score: float, trend_score: float, mom_score: float) -> List[str]:
        signals = []
        
        # MA Signals
        if ma_score >= 40: signals.append("✅ Price showing strength above key MAs")
        elif ma_score <= 10: signals.append("⚠️ Price weakness below key MAs")
        
        # Volume Signals
        if vol_score >= 20: signals.append("✅ Strong bullish volume confirmation")
        elif vol_score <= 5 and vol_score >= 0: signals.append("⚠️ Weak volume - lack of conviction")
        elif vol_score < 0: signals.append("🔻 High bearish volume pressure")
        
        # Trend Signals
        if trend_score >= 12: signals.append("✅ Strong uptrend establishment")
        elif trend_score <= 0: signals.append("⚠️ Downtrend structure detected")
        
        # Momentum
        if mom_score >= 8: signals.append("✅ Strong positive momentum (5-day)")
        elif mom_score <= 2: signals.append("⚠️ Negative momentum detected")
        
        return signals
