"""
Agent state definition for LangGraph
"""
from typing import TypedDict, Optional, Dict, Any


class AgentState(TypedDict):
    """State passed between agent nodes"""
    symbol: str
    exchange: str
    timeframe: str
    quote: Optional[Dict[str, Any]]
    ohlc_data: Optional[Dict[str, Any]]
    indicators: Optional[Dict[str, Any]]
    accumulation_zones: Optional[Any]
    failed_breakouts: Optional[Any]
    market_structure: Optional[Any] # Result from MarketStructureService
    fundamental_data: Optional[Dict[str, Any]]
    analysis: Optional[str]
    status: str
    error: Optional[str]


