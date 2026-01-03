"""
Regime Stability Service - Persistence & Duration Metrics
Tracks how long regimes persist and their historical reliability
"""
from typing import Dict, Any, List
import pandas as pd


class RegimeStabilityService:
    """
    Calculates regime stability metrics:
    - Duration: How long current regime has persisted
    - Volatility: Frequency of regime changes
    - Persistence: Historical success rate of regimes
    """
    
    @classmethod
    def calculate_stability_metrics(
        cls,
        regime_history: List[Dict[str, Any]],
        current_regime: str,
        timeframe: str = "day"
    ) -> Dict[str, Any]:
        """
        Calculate stability metrics from regime history.
        
        Args:
            regime_history: List of regime segments with start_time, end_time, bias, duration
            current_regime: Current active regime
            timeframe: 'day' or 'week' for duration formatting
            
        Returns:
            Dict containing duration, volatility, and persistence metrics
        """
        if not regime_history:
            return cls._get_default_metrics()
        
        # Calculate current regime duration
        current_duration = cls._calculate_current_duration(regime_history, current_regime)
        
        # Calculate regime change frequency (volatility)
        regime_volatility = cls._calculate_volatility(regime_history)
        
        # Calculate historical persistence rate
        persistence_rate = cls._calculate_persistence(regime_history)
        
        # Calculate stability score (0-100)
        stability_score = cls._calculate_stability_score(
            current_duration,
            regime_volatility,
            persistence_rate,
            len(regime_history)
        )
        
        return {
            "current_duration": current_duration,
            "duration_formatted": cls._format_duration(current_duration, timeframe),
            "regime_volatility": round(regime_volatility, 3),
            "persistence_rate": round(persistence_rate, 3),
            "stability_score": round(stability_score, 1),
            "total_regimes": len(regime_history),
            "regime_distribution": cls._get_regime_distribution(regime_history)
        }
    
    @classmethod
    def _calculate_current_duration(
        cls,
        regime_history: List[Dict[str, Any]],
        current_regime: str
    ) -> int:
        """Calculate duration of current regime in bars/periods."""
        if not regime_history:
            return 0
        
        # Latest regime should be current
        latest = regime_history[-1]
        if latest.get("bias", "").upper() == current_regime.upper():
            return latest.get("duration", 0)
        
        return 0
    
    @classmethod
    def _calculate_volatility(cls, regime_history: List[Dict[str, Any]]) -> float:
        """
        Calculate regime change frequency.
        Lower is more stable (fewer changes).
        """
        if len(regime_history) <= 1:
            return 0.0
        
        # Total periods covered
        total_duration = sum(r.get("duration", 0) for r in regime_history)
        if total_duration == 0:
            return 0.0
        
        # Number of regime changes
        num_changes = len(regime_history) - 1
        
        # Volatility = changes per period
        return num_changes / total_duration
    
    @classmethod
    def _calculate_persistence(cls, regime_history: List[Dict[str, Any]]) -> float:
        """
        Calculate what percentage of regimes were "successful" (not failed breakouts).
        Higher is better.
        """
        if not regime_history:
            return 0.0
        
        successful_regimes = sum(
            1 for r in regime_history
            if r.get("bias", "").upper() != "FAILED_BREAKOUT"
        )
        
        return successful_regimes / len(regime_history)
    
    @classmethod
    def _calculate_stability_score(
        cls,
        duration: int,
        volatility: float,
        persistence: float,
        total_regimes: int
    ) -> float:
        """
        Calculate overall stability score (0-100).
        
        Components:
        - Duration score (50%): Longer current regime = more stable
        - Volatility score (30%): Lower change frequency = more stable
        - Persistence score (20%): Higher success rate = more stable
        """
        # Duration score: normalize to 0-100 (cap at 50 bars = 100)
        duration_score = min(duration / 50 * 100, 100)
        
        # Volatility score: invert (low volatility = high score)
        # Cap volatility at 0.1 (very volatile) = 0 score
        volatility_score = max(0, (1 - min(volatility / 0.1, 1)) * 100)
        
        # Persistence score: direct percentage
        persistence_score = persistence * 100
        
        # Weighted composite
        stability = (
            duration_score * 0.50 +
            volatility_score * 0.30 +
            persistence_score * 0.20
        )
        
        return stability
    
    @classmethod
    def _format_duration(cls, bars: int, timeframe: str) -> str:
        """Format duration in human-readable form."""
        if timeframe == "day":
            if bars >= 20:
                months = round(bars / 20, 1)
                return f"~{months} months"
            elif bars >= 5:
                weeks = round(bars / 5, 1)
                return f"~{weeks} weeks"
            else:
                return f"{bars} days"
        elif timeframe == "week":
            if bars >= 4:
                months = round(bars / 4, 1)
                return f"~{months} months"
            else:
                return f"{bars} weeks"
        else:
            return f"{bars} bars"
    
    @classmethod
    def _get_regime_distribution(cls, regime_history: List[Dict[str, Any]]) -> Dict[str, int]:
        """Get count of each regime type in history."""
        distribution = {}
        for regime in regime_history:
            bias = regime.get("bias", "UNKNOWN")
            distribution[bias] = distribution.get(bias, 0) + 1
        return distribution
    
    @classmethod
    def _get_default_metrics(cls) -> Dict[str, Any]:
        """Fallback metrics when no history available."""
        return {
            "current_duration": 0,
            "duration_formatted": "0 bars",
            "regime_volatility": 0.0,
            "persistence_rate": 0.0,
            "stability_score": 0.0,
            "total_regimes": 0,
            "regime_distribution": {}
        }
    
    @classmethod
    def calculate_fundamental_stability(
        cls,
        fundamental_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate stability metrics for fundamental regime.
        
        Args:
            fundamental_history: List of quarterly fundamental data with scores/phases
            
        Returns:
            Dict containing fundamental regime stability metrics
        """
        if not fundamental_history or len(fundamental_history) < 2:
            return {
                "duration_quarters": 0,
                "phase_changes": 0,
                "stability_score": 0.0
            }
        
        # Count consecutive quarters in same phase
        current_phase = fundamental_history[-1].get("phase", "UNKNOWN")
        duration = 1
        
        for i in range(len(fundamental_history) - 2, -1, -1):
            if fundamental_history[i].get("phase") == current_phase:
                duration += 1
            else:
                break
        
        # Count total phase changes
        phase_changes = 0
        for i in range(1, len(fundamental_history)):
            if fundamental_history[i].get("phase") != fundamental_history[i-1].get("phase"):
                phase_changes += 1
        
        # Stability score: longer duration + fewer changes = higher score
        max_duration = len(fundamental_history)
        duration_score = (duration / max_duration) * 100
        change_penalty = (phase_changes / max_duration) * 50
        stability = max(0, duration_score - change_penalty)
        
        return {
            "duration_quarters": duration,
            "phase_changes": phase_changes,
            "stability_score": round(stability, 1),
            "current_phase": current_phase
        }
