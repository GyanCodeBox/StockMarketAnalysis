"""
LangGraph agent nodes - individual steps in the state machine
"""
from app.agent.state import AgentState
from app.services.kite_service import KiteService
from app.services.technical_tool import TechnicalTool
from app.services.llm_service import LLMService
import logging

logger = logging.getLogger(__name__)

# Initialize services
kite_service = KiteService()
technical_tool = TechnicalTool()
llm_service = LLMService()


def init_node(state: AgentState) -> AgentState:
    """
    Initialize node - validates input and sets up initial state
    """
    logger.info(f"Initializing analysis for {state['symbol']} on {state['exchange']}")
    state["status"] = "initialized"
    return state


def fetch_stock_data_node(state: AgentState) -> AgentState:
    """
    Fetch stock data from Kite API (falls back to mock data if API fails)
    """
    try:
        symbol = state["symbol"]
        exchange = state["exchange"]
        
        logger.info(f"Fetching stock data for {symbol} on {exchange}")
        
        # Fetch quote (current price) - will use mock data if API fails
        quote = kite_service.get_quote(symbol, exchange)
        
        # Fetch OHLC data (historical) - will use mock data if API fails
        ohlc_data = kite_service.get_ohlc(symbol, exchange)
        
        # Verify we got valid data (both methods return mock data if API fails, so this should always succeed)
        if not quote or not ohlc_data:
            logger.warning(f"Received empty data for {symbol}, using fallback")
            # Still set the data even if empty - the service methods always return something
            quote = quote or {}
            ohlc_data = ohlc_data or {}
        
        state["quote"] = quote
        state["ohlc_data"] = ohlc_data
        state["status"] = "data_fetched"
        
        data_source = "real" if kite_service.kite else "mock"
        logger.info(f"Successfully fetched data for {symbol} (using {data_source} data)")
        
    except Exception as e:
        # This should rarely happen since service methods handle errors internally
        logger.warning(f"Unexpected error in fetch_stock_data_node: {str(e)}. Using mock data fallback.")
        # Even on error, try to get mock data
        try:
            state["quote"] = kite_service._get_mock_quote(symbol, exchange)
            state["ohlc_data"] = kite_service._get_mock_ohlc(symbol, exchange)
            state["status"] = "data_fetched"
            logger.info(f"Using mock data fallback for {symbol}")
        except Exception as fallback_error:
            logger.error(f"Failed to get even mock data: {fallback_error}")
            state["status"] = "error"
            state["error"] = f"Failed to fetch stock data: {str(e)}"
    
    return state


def calc_indicators_node(state: AgentState) -> AgentState:
    """
    Calculate technical indicators
    """
    try:
        if state.get("status") == "error":
            return state
        
        ohlc_data = state.get("ohlc_data")
        quote = state.get("quote")
        
        if not ohlc_data:
            raise ValueError("OHLC data not available")
        
        logger.info(f"Calculating indicators for {state['symbol']}")
        
        # Calculate indicators
        indicators = technical_tool.calculate_indicators(
            ohlc_data=ohlc_data,
            current_price=quote.get("last_price", 0) if quote else 0
        )
        
        state["indicators"] = indicators
        state["status"] = "indicators_calculated"
        
        logger.info(f"Successfully calculated indicators for {state['symbol']}")
        
    except Exception as e:
        logger.error(f"Error calculating indicators: {str(e)}")
        state["status"] = "error"
        state["error"] = f"Failed to calculate indicators: {str(e)}"
    
    return state


def generate_analysis_node(state: AgentState) -> AgentState:
    """
    Generate AI analysis using LLM
    """
    try:
        if state.get("status") == "error":
            return state
        
        symbol = state["symbol"]
        quote = state.get("quote", {})
        indicators = state.get("indicators", {})
        
        logger.info(f"Generating AI analysis for {symbol}")
        
        # Generate analysis
        analysis = llm_service.generate_analysis(
            symbol=symbol,
            quote=quote,
            indicators=indicators
        )
        
        state["analysis"] = analysis
        state["status"] = "analysis_generated"
        
        logger.info(f"Successfully generated analysis for {symbol}")
        
    except Exception as e:
        logger.error(f"Error generating analysis: {str(e)}")
        state["status"] = "error"
        state["error"] = f"Failed to generate analysis: {str(e)}"
    
    return state


def format_response_node(state: AgentState) -> AgentState:
    """
    Format final response
    """
    if state.get("status") == "error":
        state["status"] = "error"
    else:
        state["status"] = "completed"
    
    logger.info(f"Analysis completed for {state['symbol']} with status: {state['status']}")
    return state


