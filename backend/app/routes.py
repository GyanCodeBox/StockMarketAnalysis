"""
API routes for stock analysis
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.agent.graph import create_agent

router = APIRouter()


class AnalyzeRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol to analyze (e.g., 'RELIANCE', 'TCS')")
    exchange: Optional[str] = Field(default="NSE", description="Exchange code (NSE, BSE)")


class AnalyzeResponse(BaseModel):
    symbol: str
    exchange: str
    quote: dict
    ohlc_data: Optional[dict] = None  # Historical OHLC data for charting
    indicators: dict
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
        
        # Create and run agent
        agent = create_agent()
        
        # Run the agent with initial state
        result = agent.invoke({
            "symbol": symbol,
            "exchange": exchange
        })
        
        # Check if analysis was successful
        if result.get("status") == "error":
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to analyze stock")
            )
        
        return AnalyzeResponse(
            symbol=result.get("symbol", symbol),
            exchange=result.get("exchange", exchange),
            quote=result.get("quote", {}),
            ohlc_data=result.get("ohlc_data", {}),
            indicators=result.get("indicators", {}),
            analysis=result.get("analysis", ""),
            status=result.get("status", "completed")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    exchange: Optional[str] = Field(default="NSE", description="Exchange code")


class SearchResponse(BaseModel):
    results: list[dict]
    count: int


@router.post("/search", response_model=SearchResponse)
async def search_stocks(request: SearchRequest):
    """
    Search for stock symbols
    """
    try:
        from app.services.kite_service import KiteService
        kite_service = KiteService()
        
        results = kite_service.search_symbols(
            query=request.query,
            exchange=request.exchange or "NSE"
        )
        
        return SearchResponse(
            results=results,
            count=len(results)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


