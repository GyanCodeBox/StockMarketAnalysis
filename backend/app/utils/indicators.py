import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional

class TechnicalIndicators:
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Simple Moving Average
        """
        if not prices or len(prices) < period:
            return [None] * len(prices)
        
        series = pd.Series(prices)
        sma = series.rolling(window=period).mean().tolist()
        return [round(x, 2) if pd.notnull(x) else None for x in sma]
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Exponential Moving Average
        """
        if not prices or len(prices) < period:
            return [None] * len(prices)
        
        series = pd.Series(prices)
        ema = series.ewm(span=period, adjust=False).mean().tolist()
        return [round(x, 2) if pd.notnull(x) else None for x in ema]
    
    @staticmethod
    def calculate_wma(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Weighted Moving Average
        """
        if not prices or len(prices) < period:
            return [None] * len(prices)
        
        weights = np.arange(1, period + 1)
        wma = []
        
        for i in range(len(prices)):
            if i < period - 1:
                wma.append(None)
                continue
            
            window = prices[i - period + 1 : i + 1]
            wma_value = np.dot(window, weights) / weights.sum()
            wma.append(wma_value)
        
        return [round(x, 2) if x is not None else None for x in wma]
    
    @classmethod
    def calculate_all_mas(cls, prices: List[float], ma_configs: List[Dict[str, Any]]) -> Dict[str, List[Optional[float]]]:
        """
        Calculate all requested moving averages
        
        Args:
            prices: List of closing prices
            ma_configs: [{"type": "SMA", "period": 50}, ...]
        
        Returns:
            {"SMA_50": [...], "EMA_21": [...], ...}
        """
        results = {}
        
        for config in ma_configs:
            ma_type = config.get('type', 'SMA').upper()
            period = config.get('period', 20)
            key = f"{ma_type}_{period}"
            
            if ma_type == 'SMA':
                results[key] = cls.calculate_sma(prices, period)
            elif ma_type == 'EMA':
                results[key] = cls.calculate_ema(prices, period)
            elif ma_type == 'WMA':
                results[key] = cls.calculate_wma(prices, period)
        
        return results
