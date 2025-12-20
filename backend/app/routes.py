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

@router.post("/fundamental/financials")
async def get_fundamental_financials(request: AnalyzeRequest):
    """
    Get only financial performance data
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        cache_key = f"fund_fin:{symbol}:{exchange}"
        cached = cache_manager.get(cache_key)
        if cached: return cached
        
        from app.tools.fundamental_tool import FundamentalTool
        tool = FundamentalTool()
        data = await tool.get_financial_data(symbol, exchange)
        
        cache_manager.set(cache_key, data, ttl_seconds=3600)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fundamental/shareholding")
async def get_fundamental_shareholding(request: AnalyzeRequest):
    """
    Get only shareholding pattern data
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        cache_key = f"fund_share:{symbol}:{exchange}"
        cached = cache_manager.get(cache_key)
        if cached: return cached
        
        from app.tools.fundamental_tool import FundamentalTool
        tool = FundamentalTool()
        data = await tool.get_ownership_data(symbol, exchange)
        
        cache_manager.set(cache_key, data, ttl_seconds=86400) # 1 day
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fundamental/ai-insights")
async def get_fundamental_ai_insights(request: AnalyzeRequest):
    """
    Generate AI insights for fundamentals
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        cache_key = f"fund_ai:{symbol}:{exchange}"
        cached = cache_manager.get(cache_key)
        if cached: return {"analysis": cached}
        
        from app.tools.fundamental_tool import FundamentalTool
        from app.agent.nodes import llm_service
        
        tool = FundamentalTool()
        # Fetch data needed for AI
        tasks = [
            tool.get_financial_data(symbol, exchange),
            tool.get_ownership_data(symbol, exchange)
        ]
        import asyncio
        fin, owner = await asyncio.gather(*tasks)
        
        prompt = f"""Analyze the fundamental health of {symbol}. 
Financials: {fin}
Ownership: {owner}
Please provide a deep dive into financial strength, growth prospects, and potential risks. 
Format with markdown headers."""
        
        # We can reuse the generate_analysis but maybe refine for fundamentals
        # For now, let's use a direct prompt to llm_service
        analysis = await llm_service._generate_with_openai(prompt)
        
        cache_manager.set(cache_key, analysis, ttl_seconds=3600)
        return {"analysis": analysis}
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
    Optimized AI Summary endpoint (Async)
    Uses cached technical/fundamental data or fetches them in parallel.
    """
    try:
        symbol = request.symbol.strip().upper()
        exchange = request.exchange or "NSE"
        timeframe = request.timeframe or "day"
        
        # 1. Check final summary cache
        summary_cache_key = f"summary:{symbol}:{exchange}:{timeframe}"
        cached_summary = cache_manager.get(summary_cache_key)
        if cached_summary:
            return {"analysis": cached_summary}
            
        # 2. Try to get components from cache
        tech_cache_key = f"technical:{symbol}:{exchange}:{timeframe}"
        fund_cache_key = f"fundamental:{symbol}:{exchange}"
        
        tech_data = cache_manager.get(tech_cache_key)
        fund_data = cache_manager.get(fund_cache_key)
        
        # 3. If missing, fetch them in parallel
        import asyncio
        from app.services.technical_tool import TechnicalTool
        from app.tools.fundamental_tool import FundamentalTool
        from app.services.llm_service import LLMService # Should use the global one if exists
        
        # We need the global llm_service initialized at the top
        # (Assuming it will be there after my previous edits)
        
        tasks = []
        if not tech_data:
            from app.services.kite_service import KiteService
            kite = KiteService()
            tech = TechnicalTool()
            
            async def get_tech():
                days = 365; interval = "day"
                if timeframe == "week": days = 1095; interval = "week"
                elif timeframe == "hour": days = 60; interval = "hour"
                
                tasks_tech = [
                    asyncio.to_thread(kite.get_quote, symbol, exchange),
                    asyncio.to_thread(kite.get_ohlc, symbol, exchange, days, interval)
                ]
                q, ohlc = await asyncio.gather(*tasks_tech)
                indicators = tech.calculate_indicators(ohlc, q.get("last_price", 0))
                return {"quote": q, "indicators": indicators, "ohlc_data": ohlc}
            
            tasks.append(get_tech())
        else:
            # Wrap existing data in a future-like result
            async def wrap_tech(): return tech_data
            tasks.append(wrap_tech())
            
        if not fund_data:
            fund_tool = FundamentalTool()
            tasks.append(fund_tool.analyze_stock(symbol, exchange))
        else:
            async def wrap_fund(): return fund_data
            tasks.append(wrap_fund())
            
        # Run parallel fetches
        fetched_results = await asyncio.gather(*tasks)
        
        # Map results back
        t_data = fetched_results[0]
        f_data = fetched_results[1]
        
        # Cache them for other endpoints too
        if not tech_data:
            cache_manager.set(tech_cache_key, t_data, ttl_seconds=300)
        if not fund_data:
            cache_manager.set(fund_cache_key, f_data, ttl_seconds=3600)
            
        # 4. Generate Analysis
        from app.agent.nodes import llm_service # Use the global one
        analysis = await llm_service.generate_analysis(
            symbol=symbol,
            quote=t_data["quote"],
            indicators=t_data["indicators"],
            fundamental_data=f_data
        )
        
        # 5. Cache and return
        cache_manager.set(summary_cache_key, analysis, ttl_seconds=900)
        return {"analysis": analysis}
        
    except Exception as e:
        logger.error(f"Summary generation error: {e}")
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


