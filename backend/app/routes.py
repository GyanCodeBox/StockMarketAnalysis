"""
API routes for stock analysis
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.agent.graph import create_agent
from app.services.cache import cache_manager
from app.services.kite_service import KiteService

router = APIRouter()
kite_service = KiteService()


class AnalyzeRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol to analyze (e.g., 'RELIANCE', 'TCS')")
    exchange: Optional[str] = Field(default="NSE", description="Exchange code (NSE, BSE)")
    timeframe: Optional[str] = Field(default="day", description="Timeframe: 'day', 'week', 'hour'")


class AnalyzeResponse(BaseModel):
    symbol: str
    exchange: str
    quote: dict
    ohlc_data: Optional[dict] = None  # Historical OHLC data for charting
    indicators: dict
    fundamental_data: Optional[dict] = None # Fundamental analysis data
    analysis: str
    status: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_stock(request: AnalyzeRequest):
    """
    Analyze a stock symbol using the LangGraph agent
    
    Args:
        request: Contains symbol and optional exchange
        
    Returns:
        Stock data, indicators, and AI-generated analysis
    """
    try:
        # Validate input
        symbol = request.symbol.strip().upper()
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol cannot be empty")
        
        exchange = request.exchange or "NSE"
        
        # 0. Check Cache
        cache_key = f"analyze:{symbol}:{exchange}:{request.timeframe or 'day'}"
        cached_result = cache_manager.get(cache_key)
        if cached_result:
            return AnalyzeResponse(**cached_result)

        # Create and run agent
        agent = create_agent()
        
        # Run the agent with initial state (Async)
        result = await agent.ainvoke({
            "symbol": symbol,
            "exchange": exchange,
            "timeframe": request.timeframe or "day"
        })
        
        # Check if analysis was successful
        if result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to analyze stock")
            )
        
        response_data = {
            "symbol": result.get("symbol", symbol),
            "exchange": result.get("exchange", exchange),
            "quote": result.get("quote", {}),
            "ohlc_data": result.get("ohlc_data", {}),
            "indicators": result.get("indicators", {}),
            "fundamental_data": result.get("fundamental_data"),
            "analysis": result.get("analysis", ""),
            "status": result.get("status", "completed")
        }
        
        # Save to Cache (15 min for analyzer results)
        cache_manager.set(cache_key, response_data, ttl_seconds=900)
        
        return AnalyzeResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
@router.post("/analyze/fundamental")
async def analyze_fundamental(request: AnalyzeRequest):
    """
    Standalone fundamental analysis (Async)
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        
        cache_key = f"fundamental:{symbol}:{exchange}"
        cached = cache_manager.get(cache_key)
        if cached:
            return cached
            
        from app.tools.fundamental_tool import FundamentalTool
        tool = FundamentalTool()
        data = await tool.analyze_stock(symbol, exchange)
        
        cache_manager.set(cache_key, data, ttl_seconds=3600) # 1 hour
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/technical")
async def analyze_technical(request: AnalyzeRequest):
    """
    Standalone technical analysis (Async)
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        timeframe = request.timeframe or "day"
        
        cache_key = f"technical:{symbol}:{exchange}:{timeframe}"
        cached = cache_manager.get(cache_key)
        if cached:
            return cached
            
        from app.services.technical_tool import TechnicalTool
        import asyncio
        
        # Use global kite_service
        tech = TechnicalTool()
        
        # 1. Fetch data
        days = 365
        interval = "day"
        if timeframe == "week": days = 1095; interval = "week"
        elif timeframe == "hour": days = 60; interval = "hour"
        
        tasks = [
            asyncio.to_thread(kite_service.get_quote, symbol, exchange),
            asyncio.to_thread(kite_service.get_ohlc, symbol, exchange, days, interval)
        ]
        quote, ohlc = await asyncio.gather(*tasks)
        
        # 2. Calc indicators
        indicators = tech.calculate_indicators(ohlc, quote.get("last_price", 0))
        
        data = {
            "symbol": symbol,
            "quote": quote,
            "ohlc_data": ohlc,
            "indicators": indicators
        }
        
        cache_manager.set(cache_key, data, ttl_seconds=300) # 5 min for tech
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/summary")
async def analyze_summary(request: AnalyzeRequest):
    """
    Standalone AI Summary endpoint (Async)
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        
        cache_key = f"summary:{symbol}:{exchange}"
        cached = cache_manager.get(cache_key)
        if cached:
            return {"analysis": cached}
            
        agent = create_agent()
        result = await agent.ainvoke({
            "symbol": symbol,
            "exchange": exchange,
            "timeframe": request.timeframe or "day"
        })
        
        analysis = result.get("analysis", "")
        cache_manager.set(cache_key, analysis, ttl_seconds=900)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    exchange: Optional[str] = Field(default="NSE", description="Exchange code")


class SearchResponse(BaseModel):
    results: list[dict]
    count: int


@router.post("/search", response_model=SearchResponse)
async def search_stocks(request: SearchRequest):
    """
    Search for stock symbols (with caching)
    """
    try:
        query = request.query.strip().upper()
        exchange = request.exchange or "NSE"
        
        if not query:
            return SearchResponse(results=[], count=0)
            
        # Check Cache
        cache_key = f"search:{query}:{exchange}"
        cached = cache_manager.get(cache_key)
        if cached:
            return SearchResponse(**cached)
            
        results = kite_service.search_symbols(
            query=query,
            exchange=exchange
        )
        
        response_data = {
            "results": results,
            "count": len(results)
        }
        
        # Cache search results for 1 hour (instrument list doesn't change much)
        cache_manager.set(cache_key, response_data, ttl_seconds=3600)
        
        return SearchResponse(**response_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


