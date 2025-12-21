"""
Technical indicators calculator
"""
import logging
from typing import Dict, Any, List, Optional
import statistics

logger = logging.getLogger(__name__)


class TechnicalTool:
    """Service for calculating technical indicators"""
    
    def calculate_indicators(self, ohlc_data: Dict[str, Any], current_price: float, ma_configs: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Calculate technical indicators from OHLC data
        
        Args:
            ohlc_data: Dictionary containing historical OHLC data
            current_price: Current stock price
            ma_configs: Custom MA configurations [{"type": "SMA", "period": 50}, ...]
            
        Returns:
            Dictionary with calculated indicators
        """
        try:
            from app.utils.indicators import TechnicalIndicators
            data = ohlc_data.get("data", [])
            
            if not data:
                raise ValueError("No OHLC data available")
            
            # Sort and extract prices (existing logic...)
            if isinstance(data[0], dict) and "date" in data[0]:
                # Deduplicate by date
                unique_data = {}
                for item in data:
                    d = item.get("date")
                    if d:
                        # Use string representation of date for mapping
                        d_str = d.isoformat() if hasattr(d, 'isoformat') else str(d)
                        unique_data[d_str] = item
                data = list(unique_data.values())
                
                def get_date_key(item):
                    date_val = item.get("date")
                    if hasattr(date_val, 'isoformat'):  # datetime object
                        return date_val.isoformat()
                    return str(date_val)
                data = sorted(data, key=get_date_key)
            
            closes, highs, lows, volumes = [], [], [], []
            for item in data:
                if not isinstance(item, dict): continue
                c = item.get("close") or item.get("Close"); h = item.get("high") or item.get("High")
                l = item.get("low") or item.get("Low"); v = item.get("volume") or item.get("Volume")
                if c is not None: closes.append(float(c))
                if h is not None: highs.append(float(h))
                if l is not None: lows.append(float(l))
                if v is not None: volumes.append(float(v))
            
            # Dynamic MA Calculation
            if not ma_configs:
                # Default MAs if none provided
                ma_configs = [
                    {"type": "SMA", "period": 20},
                    {"type": "SMA", "period": 50},
                    {"type": "SMA", "period": 200}
                ]
            
            ma_results = TechnicalIndicators.calculate_all_mas(closes, ma_configs)
            
            indicators = {
                "moving_averages": ma_results,
                "support_levels": self._calculate_support_levels(lows),
                "resistance_levels": self._calculate_resistance_levels(highs),
                "volume_analysis": self._analyze_volume(volumes),
                "current_price": current_price,
                "price_trend": self._determine_trend(closes),
                "volatility": self._calculate_volatility(closes)
            }
            
            # Backward compatibility for sma_20, sma_50, sma_200 (optional but helpful)
            indicators["sma_20"] = ma_results.get("SMA_20", [None])[-1]
            indicators["sma_50"] = ma_results.get("SMA_50", [None])[-1]
            indicators["sma_200"] = ma_results.get("SMA_200", [None])[-1]
            
            return indicators
            
            return indicators
            
        except Exception as e:
            logger.error(f"Error calculating indicators: {e}")
            raise
    
    def _calculate_sma(self, prices: List[float], period: int) -> float:
        """
        Calculate Simple Moving Average (SMA)
        
        SMA = Average of closing prices over the last N periods
        Example: 20-day SMA = (Sum of last 20 closing prices) / 20
        
        Args:
            prices: List of closing prices in chronological order (oldest to newest)
            period: Number of periods (e.g., 20 for 20-day SMA)
            
        Returns:
            SMA value rounded to 2 decimal places
        """
        if len(prices) < period:
            # Not enough data, return average of available prices
            return round(statistics.mean(prices), 2) if prices else 0.0
        
        # Take the last N prices (most recent N days)
        recent_prices = prices[-period:]
        return round(statistics.mean(recent_prices), 2)
    
    def _calculate_support_levels(self, lows: List[float], num_levels: int = 3) -> List[float]:
        """
        Calculate support levels using pivot point method (local minima)
        Support = price levels where price bounced up (local lows that were tested)
        """
        if len(lows) < 3:
            # Not enough data, return recent lows
            return [round(min(lows), 2)] if lows else []
        
        # Find local minima (pivot lows)
        # A local minimum is a point lower than its neighbors
        pivot_lows = []
        window = 2  # Look 2 periods on each side
        
        for i in range(window, len(lows) - window):
            # Check if current low is lower than neighbors
            is_local_min = True
            for j in range(i - window, i + window + 1):
                if j != i and lows[j] < lows[i]:
                    is_local_min = False
                    break
            
            if is_local_min:
                pivot_lows.append(lows[i])
        
        # If we found pivot lows, use them; otherwise use recent lows
        if pivot_lows:
            # Get the most significant support levels (lowest values, but recent ones prioritized)
            # Take unique values, sort, and get the lowest N that are below current price
            unique_lows = sorted(set(pivot_lows))
            # Prioritize recent significant lows
            support_levels = unique_lows[:num_levels]
        else:
            # Fallback: use recent lows (last 10 days minimum)
            recent_lows = lows[-10:] if len(lows) >= 10 else lows
            unique_lows = sorted(set(recent_lows))
            support_levels = unique_lows[:num_levels]
        
        return [round(level, 2) for level in support_levels]
    
    def _calculate_resistance_levels(self, highs: List[float], num_levels: int = 3) -> List[float]:
        """
        Calculate resistance levels using pivot point method (local maxima)
        Resistance = price levels where price bounced down (local highs that were tested)
        """
        if len(highs) < 3:
            # Not enough data, return recent highs
            return [round(max(highs), 2)] if highs else []
        
        # Find local maxima (pivot highs)
        # A local maximum is a point higher than its neighbors
        pivot_highs = []
        window = 2  # Look 2 periods on each side
        
        for i in range(window, len(highs) - window):
            # Check if current high is higher than neighbors
            is_local_max = True
            for j in range(i - window, i + window + 1):
                if j != i and highs[j] > highs[i]:
                    is_local_max = False
                    break
            
            if is_local_max:
                pivot_highs.append(highs[i])
        
        # If we found pivot highs, use them; otherwise use recent highs
        if pivot_highs:
            # Get the most significant resistance levels (highest values)
            # Take unique values, sort descending, and get the highest N
            unique_highs = sorted(set(pivot_highs), reverse=True)
            resistance_levels = unique_highs[:num_levels]
        else:
            # Fallback: use recent highs (last 10 days minimum)
            recent_highs = highs[-10:] if len(highs) >= 10 else highs
            unique_highs = sorted(set(recent_highs), reverse=True)
            resistance_levels = unique_highs[:num_levels]
        
        return [round(level, 2) for level in resistance_levels]
    
    def _analyze_volume(self, volumes: List[float]) -> Dict[str, Any]:
        """Analyze volume patterns"""
        if not volumes:
            return {"average_volume": 0, "recent_volume": 0, "volume_trend": "neutral"}
        
        recent_volumes = volumes[-5:] if len(volumes) >= 5 else volumes
        average_volume = statistics.mean(volumes)
        recent_avg_volume = statistics.mean(recent_volumes)
        
        if recent_avg_volume > average_volume * 1.2:
            trend = "increasing"
        elif recent_avg_volume < average_volume * 0.8:
            trend = "decreasing"
        else:
            trend = "neutral"
        
        return {
            "average_volume": round(average_volume, 2),
            "recent_volume": round(recent_avg_volume, 2),
            "volume_trend": trend
        }
    
    def _determine_trend(self, closes: List[float], short_period: int = 5, long_period: int = 20) -> str:
        """Determine price trend"""
        if len(closes) < long_period:
            if len(closes) < short_period:
                return "insufficient_data"
            short_avg = statistics.mean(closes[-short_period:])
            long_avg = statistics.mean(closes)
        else:
            short_avg = statistics.mean(closes[-short_period:])
            long_avg = statistics.mean(closes[-long_period:])
        
        if short_avg > long_avg * 1.02:
            return "bullish"
        elif short_avg < long_avg * 0.98:
            return "bearish"
        else:
            return "neutral"
    
    def _calculate_volatility(self, closes: List[float]) -> float:
        """Calculate price volatility (standard deviation of returns)"""
        if len(closes) < 2:
            return 0.0
        
        returns = []
        for i in range(1, len(closes)):
            if closes[i-1] > 0:
                ret = (closes[i] - closes[i-1]) / closes[i-1]
                returns.append(ret)
        
        if not returns:
            return 0.0
        
        return round(statistics.stdev(returns) * 100, 2)  # Return as percentage

