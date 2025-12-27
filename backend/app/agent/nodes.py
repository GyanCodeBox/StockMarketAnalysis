"""
LangGraph agent nodes - individual steps in the state machine
"""
from app.agent.state import AgentState
from app.services.kite_service import KiteService
from app.services.technical_tool import TechnicalTool
from app.services.accumulation_zone_service import AccumulationZoneService
from app.services.failed_breakout_service import FailedBreakoutService
from app.tools.fundamental_tool import FundamentalTool
from app.services.llm_service import LLMService
from app.services.market_structure_service import MarketStructureService
import logging

logger = logging.getLogger(__name__)

# Initialize services
kite_service = KiteService()
technical_tool = TechnicalTool()
accumulation_service = AccumulationZoneService()
failed_breakout_service = FailedBreakoutService()
market_structure_service = MarketStructureService()
fundamental_tool = FundamentalTool()
llm_service = LLMService()


async def init_node(state: AgentState) -> AgentState:
    """
    Initialize node - validates input and sets up initial state
    """
    logger.info(f"Initializing analysis for {state['symbol']} on {state['exchange']}")
    state["status"] = "initialized"
    return state


async def fetch_stock_data_node(state: AgentState) -> AgentState:
    """
    Fetch stock data from Kite API (Parallelized, Async)
    """
    import asyncio
    try:
        symbol = state["symbol"]
        exchange = state["exchange"]
        timeframe = state.get("timeframe", "day")
        
        logger.info(f"Fetching stock data for {symbol} on {exchange} ({timeframe})")
        
        # Determine duration and interval
        days = 365
        interval = "day"
        if timeframe == "week":
            days = 1095
            interval = "week"
        elif timeframe == "hour":
            days = 60
            interval = "hour"
        
        # Run sync Kite calls in threads to avoid blocking, and execute them in parallel
        loop = asyncio.get_event_loop()
        
        tasks = [
            loop.run_in_executor(None, kite_service.get_quote, symbol, exchange),
            loop.run_in_executor(None, kite_service.get_ohlc, symbol, exchange, days, interval)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        quote, ohlc_data = results
        
        # Handle exceptions
        if isinstance(quote, Exception):
            logger.error(f"Error fetching quote: {quote}")
            quote = {}
        if isinstance(ohlc_data, Exception):
            logger.error(f"Error fetching ohlc: {ohlc_data}")
            ohlc_data = {}
        
        # Fallback for volume
        if quote.get("volume") == 0 and ohlc_data.get("data"):
            last_ohlc = ohlc_data["data"][-1]
            last_vol = last_ohlc.get("volume") or last_ohlc.get("Volume") or 0
            if last_vol > 0:
                quote["volume"] = last_vol
        
        state["quote"] = quote
        state["ohlc_data"] = ohlc_data
        state["status"] = "data_fetched"
        
    except Exception as e:
        logger.warning(f"Error in fetch_stock_data_node: {str(e)}")
        state["quote"] = kite_service._get_mock_quote(state["symbol"], state["exchange"])
        state["ohlc_data"] = kite_service._get_mock_ohlc(state["symbol"], state["exchange"])
        state["status"] = "data_fetched"
    
    return state


async def calc_indicators_node(state: AgentState) -> AgentState:
    """
    Calculate technical indicators (Async)
    """
    try:
        if state.get("status") == "error":
            return state
        
        ohlc_data = state.get("ohlc_data")
        quote = state.get("quote")
        
        if not ohlc_data:
            raise ValueError("OHLC data not available")
        
        logger.info(f"Calculating indicators for {state['symbol']}")
        
        # This is a CPU-bound pandas operation, but we'll follow the pattern
        import asyncio
        loop = asyncio.get_event_loop()
        indicators = await loop.run_in_executor(
            None, 
            technical_tool.calculate_indicators,
            ohlc_data,
            quote.get("last_price", 0) if quote else 0
        )
        
        state["indicators"] = indicators
        try:
            state["accumulation_zones"] = accumulation_service.detect_zones(
                ohlc_data,
                lookback=60,
                trend_context="downtrend" if indicators.get("price_trend") == "bearish" else "unknown",
            )
        except Exception as zone_err:
            logger.warning(f"Accumulation zone detection failed: {zone_err}")
            state["accumulation_zones"] = []
        try:
            state["failed_breakouts"] = failed_breakout_service.detect_failed_breakouts(
                ohlc_data,
                indicators=indicators,
            )
        except Exception as fb_err:
            logger.warning(f"Failed breakout detection failed: {fb_err}")
            state["failed_breakouts"] = []
            state["failed_breakouts"] = []

        # Market Structure Decision Matrix (Arbitration)
        try:
            structure = market_structure_service.evaluate_structure(
                ohlc_data,
                indicators=indicators
            )
            state["market_structure"] = structure.to_dict()
        except Exception as struct_err:
            logger.warning(f"Market structure evaluation failed: {struct_err}")
            state["market_structure"] = None

        state["status"] = "indicators_calculated"
        
    except Exception as e:
        logger.error(f"Error calculating indicators: {str(e)}")
        state["status"] = "error"
        state["error"] = f"Failed to calculate indicators: {str(e)}"
    
    return state



async def fundamental_analysis_node(state: AgentState) -> AgentState:
    """
    Perform fundamental analysis (Async)
    """
    try:
        if state.get("status") == "error":
            return state
            
        symbol = state["symbol"]
        exchange = state["exchange"]
        
        logger.info(f"Running fundamental analysis for {symbol}")
        
        # Run async analysis tool
        fund_data = await fundamental_tool.analyze_stock(symbol, exchange)
        
        state["fundamental_data"] = fund_data
        state["status"] = "fundamental_analysis_completed"
        
    except Exception as e:
        logger.error(f"Error in fundamental analysis: {str(e)}")
        state["fundamental_data"] = None
        
    return state


async def generate_analysis_node(state: AgentState) -> AgentState:
    """
    Generate AI analysis (Async)
    """
    try:
        if state.get("status") == "error":
            return state
        
        symbol = state["symbol"]
        quote = state.get("quote", {})
        indicators = state.get("indicators", {})
        fundamental_data = state.get("fundamental_data")
        
        logger.info(f"Generating AI analysis for {symbol}")
        
        # Run LLM generation in thread if it's blocking
        analysis = await llm_service.generate_analysis(
            symbol,
            quote,
            indicators,
            fundamental_data
        )
        
        state["analysis"] = analysis
        state["status"] = "analysis_generated"
        
    except Exception as e:
        logger.error(f"Error generating analysis: {str(e)}")
        state["status"] = "error"
        state["error"] = f"Failed to generate analysis: {str(e)}"
    
    return state


async def format_response_node(state: AgentState) -> AgentState:
    """
    Format final response (Async)
    """
    if state.get("status") == "error":
        state["status"] = "error"
    else:
        state["status"] = "completed"
    
    logger.info(f"Analysis completed for {state['symbol']}")
    return state


