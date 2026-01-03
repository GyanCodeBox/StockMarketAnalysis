"""
API routes for stock analysis
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
from app.agent.graph import create_agent
from app.services.cache import cache_manager
from app.services.kite_service import KiteService
from app.services.candle_explainer import CandleExplainer, CandleContext

router = APIRouter()
logger = logging.getLogger(__name__)
kite_service = KiteService()


class MovingAverageConfig(BaseModel):
    type: str = Field(..., pattern="^(SMA|EMA|WMA|sma|ema|wma)$")
    period: int = Field(..., ge=1, le=500)

class AnalyzeRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol to analyze (e.g., 'RELIANCE', 'TCS')")
    exchange: Optional[str] = Field(default="NSE", description="Exchange code (NSE, BSE)")
    timeframe: Optional[str] = Field(default="day", description="Timeframe: 'day', 'week', 'hour', '15minute', '5minute'")
    moving_averages: Optional[List[MovingAverageConfig]] = Field(default=None, description="Custom MA configurations")
    previous_bias: Optional[str] = Field(default=None, description="Previous market structure bias for transition narration")

class AnalyzeResponse(BaseModel):
    symbol: str
    exchange: str
    quote: dict
    ohlc_data: Optional[dict] = None  # Historical OHLC data for charting
    indicators: dict
    accumulation_zones: Optional[list] = None
    distribution_zones: Optional[list] = None
    failed_breakouts: Optional[list] = None
    market_structure: Optional[dict] = None # New field
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
            "accumulation_zones": result.get("accumulation_zones", []),
            "failed_breakouts": result.get("failed_breakouts", []),
            "market_structure": result.get("market_structure"),
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
        elif timeframe == "15minute": days = 7; interval = "15minute"
        elif timeframe == "5minute": days = 3; interval = "5minute"
        
        # Prepare MA Configs if provided
        ma_configs = None
        if request.moving_averages:
            ma_configs = [ma.dict() for ma in request.moving_averages]
        
        tasks = [
            asyncio.to_thread(kite_service.get_quote, symbol, exchange),
            asyncio.to_thread(kite_service.get_ohlc, symbol, exchange, days, interval)
        ]
        quote, ohlc = await asyncio.gather(*tasks)
        
        # Volume Fallback: If quote volume is 0 (common on holidays/off-market), use latest OHLC volume
        if quote and quote.get("volume") == 0 and ohlc.get("data"):
            for i in range(1, min(len(ohlc["data"]), 4)):
                candle = ohlc["data"][-i]
                v = candle.get("volume") or candle.get("Volume") or 0
                if v > 0:
                    quote["volume"] = v
                    break
        
        # 2. Calc indicators
        indicators = tech.calculate_indicators(ohlc, quote.get("last_price", 0), ma_configs=ma_configs)
        
        from app.services.accumulation_zone_service import AccumulationZoneService
        from app.services.distribution_zone_service import DistributionZoneService
        from app.services.market_structure_service import MarketStructureService
        from app.services.failed_breakout_service import FailedBreakoutService

        acc_zones = AccumulationZoneService(use_formalized_logic=True).detect_zones(ohlc, lookback=60, timeframe=timeframe)
        dist_zones = DistributionZoneService().detect_zones(ohlc, indicators=indicators, timeframe=timeframe)
        
        failed_breakouts = FailedBreakoutService().detect_failed_breakouts(
            ohlc,
            indicators=indicators,
        )
        
        # 3. Market Structure Arbitration
        structure = MarketStructureService().evaluate_structure(
            ohlc, 
            indicators=indicators,
            acc_zones=acc_zones,
            dist_zones=dist_zones,
            previous_bias=request.previous_bias
        )
        market_structure = structure.to_dict()
        
        data = {
            "symbol": symbol,
            "quote": quote,
            "ohlc_data": ohlc,
            "indicators": indicators,
            "accumulation_zones": acc_zones,
            "distribution_zones": dist_zones,
            "failed_breakouts": failed_breakouts,
            "market_structure": market_structure,
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


class OHLC(BaseModel):
    open: float
    high: float
    low: float
    close: float


class ExplainCandleRequest(BaseModel):
    ohlc: OHLC
    volume: str = Field(..., pattern="^(low|avg|high)$")
    trend: str = Field("unknown", pattern="^(up|down|range|unknown)$")
    near_level: str = Field("none", pattern="^(support|resistance|none)$")
    level_price: Optional[float] = None
    gap: str = Field("none", pattern="^(none|up|down)$")
    news_flag: Optional[bool] = False
    prev_high: Optional[float] = None
    prev_low: Optional[float] = None


class ExplainCandleResponse(BaseModel):
    summary: str
    context: List[str]
    interpretation: str
    what_to_watch: List[str]
    confidence: str


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


@router.post("/explain-candle", response_model=ExplainCandleResponse)
async def explain_candle(request: ExplainCandleRequest):
    """
    Rule-based candle explanation for MVP (no external AI dependency)
    """
    try:
        ctx = CandleContext(
            open=request.ohlc.open,
            high=request.ohlc.high,
            low=request.ohlc.low,
            close=request.ohlc.close,
            volume_bucket=request.volume,
            trend=request.trend,
            near_level=request.near_level,
            level_price=request.level_price,
            gap=request.gap,
            news_flag=bool(request.news_flag),
            prev_high=request.prev_high,
            prev_low=request.prev_low,
        )
        result = CandleExplainer.explain(ctx)
        return ExplainCandleResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# ============================================================================
# PHASE 2: INSTITUTIONAL DECISION INTELLIGENCE
# ============================================================================

@router.post("/analysis/summary")
async def get_decision_intelligence(request: AnalyzeRequest):
    """
    Phase 2: Unified Decision Intelligence Endpoint
    
    Provides:
    - Tech-Fundamental Confluence State
    - Composite Regime Score (0-100)
    - Regime Stability Metrics
    - Risk Constraint Analysis
    
    Answers: "Is price aligned with business reality? Where is risk asymmetric?"
    """
    from app.services.confluence_service import ConfluenceService
    from app.services.composite_scoring_service import CompositeScoringService
    from app.services.regime_stability_service import RegimeStabilityService
    from app.services.risk_constraint_service import RiskConstraintService
    import asyncio
    from datetime import datetime
    
    try:
        symbol = request.symbol.upper()
        exchange = request.exchange or "NSE"
        
        # Fetch technical and fundamental data in parallel by calling existing endpoints
        tech_data, funda_data = await asyncio.gather(
            analyze_technical(request),
            get_fundamental_financials(request)
        )
        
        # Extract technical metrics
        tech_regime = tech_data.get("market_structure", {}).get("current_bias", "NEUTRAL")
        tech_confidence = tech_data.get("market_structure", {}).get("confidence", "MEDIUM")
        tech_score = tech_data.get("indicators", {}).get("technical_score", {}).get("score", 50)
        regime_history = tech_data.get("market_structure", {}).get("regime_history", [])
        
        # Extract fundamental metrics
        funda_score_obj = funda_data.get("score", {})
        funda_regime = funda_score_obj.get("grade", "NEUTRAL")  # STRONG/NEUTRAL/WEAK
        funda_score = funda_score_obj.get("value", 50)
        funda_phase = funda_score_obj.get("phase", "Maturity")
        
        # Get latest fundamental metrics for risk assessment
        latest_funda = {}
        if funda_data.get("raw", {}).get("quarterly"):
            latest_derived = funda_data.get("derived", {}).get("yoy", [{}])[0]
            latest_efficiency = funda_data.get("derived", {}).get("efficiency", [{}])[0]
            
            latest_funda = {
                "other_income_ratio": latest_derived.get("other_income_ratio", 0),
                "roce": latest_efficiency.get("roce", 0),
                "net_margin_pct": latest_derived.get("net_margin_pct", 0),
                "net_margin_yoy_delta": latest_derived.get("net_margin_yoy_delta", 0)
            }
        
        # ===== PHASE 2 SERVICES =====
        
        # 1. Confluence Analysis
        confluence = ConfluenceService.get_confluence_state(
            tech_regime,
            funda_regime
        )
        
        # 2. Regime Stability
        tech_stability = RegimeStabilityService.calculate_stability_metrics(
            regime_history,
            tech_regime,
            request.timeframe or "day"
        )
        
        # For fundamental stability, we need quarterly history
        funda_quarterly = funda_data.get("raw", {}).get("quarterly", [])
        funda_history = []
        for q in funda_quarterly:
            funda_history.append({
                "phase": funda_phase,  # Simplified - in production, track phase per quarter
                "score": funda_score
            })
        
        funda_stability = RegimeStabilityService.calculate_fundamental_stability(
            funda_history
        )
        
        # 3. Composite Score
        composite = CompositeScoringService.calculate_composite_score(
            tech_score,
            funda_score,
            tech_stability.get("stability_score", 50)
        )
        
        # 4. Risk Constraints
        risk_constraints = RiskConstraintService.assess_risk_constraints(
            latest_funda,
            {
                "regime": tech_regime,
                "confidence": tech_confidence
            }
        )
        
        risk_summary = RiskConstraintService.get_risk_summary(risk_constraints)
        
        # ===== RESPONSE =====
        
        return {
            "symbol": symbol,
            "exchange": exchange,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            
            "technical_state": {
                "regime": tech_regime,
                "confidence": tech_confidence,
                "duration_bars": tech_stability.get("current_duration", 0),
                "duration_formatted": tech_stability.get("duration_formatted", "0 bars"),
                "score": tech_score
            },
            
            "fundamental_state": {
                "regime": funda_regime,
                "phase": funda_phase,
                "duration_quarters": funda_stability.get("duration_quarters", 0),
                "score": funda_score,
                "diagnostic": funda_score_obj.get("diagnostic", "")
            },
            
            "confluence": confluence,
            
            "composite_score": composite,
            
            "stability_metrics": {
                "technical": {
                    "duration": tech_stability.get("current_duration", 0),
                    "volatility": tech_stability.get("regime_volatility", 0),
                    "persistence_rate": tech_stability.get("persistence_rate", 0),
                    "score": tech_stability.get("stability_score", 0)
                },
                "fundamental": {
                    "duration_quarters": funda_stability.get("duration_quarters", 0),
                    "phase_changes": funda_stability.get("phase_changes", 0),
                    "score": funda_stability.get("stability_score", 0)
                }
            },
            
            "risk_constraints": risk_constraints,
            "risk_summary": risk_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"Decision intelligence error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Decision intelligence error: {str(e)}"
        )

