from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
from app.services.cache import cache_manager
from app.services.confluence_service import ConfluenceService
from app.services.composite_scoring_service import CompositeScoringService
from app.services.regime_stability_service import RegimeStabilityService
from app.services.risk_constraint_service import RiskConstraintService

# Import existing endpoints/logic to reuse
from app.routes import analyze_technical, get_fundamental_financials

router = APIRouter()

class PortfolioInput(BaseModel):
    symbols: List[str] = Field(..., description="List of stock symbols")
    exchange: str = Field(default="NSE", description="Exchange code")

class PortfolioStock(BaseModel):
    symbol: str
    confluence_state: str
    confluence_fmt: str
    composite_score: float
    risk_level: str
    key_constraint: Optional[str] = None
    attention_flag: str
    stability: str

class PortfolioSummary(BaseModel):
    total_stocks: int
    aligned_strength_pct: float
    high_risk_pct: float
    attention_distribution: Dict[str, int]

class PortfolioSummaryResponse(BaseModel):
    summary: PortfolioSummary
    stocks: List[PortfolioStock]

async def analyze_single_stock(sym: str, exchange: str = "NSE"):
    try:
        summary_cache_key = f"portfolio_item:{sym}:{exchange}"
        cached = cache_manager.get(summary_cache_key)
        if cached:
            return cached

        # Import the AnalyzeRequest from routes
        from app.routes import analyze_summary, AnalyzeRequest
        
        # Construct Request
        req = AnalyzeRequest(
            symbol=sym, 
            exchange=exchange, 
            timeframe="day",
            mode="metrics_only"
        )
        
        # Call the optimized endpoint logic directly
        result_data = await analyze_summary(req)
        
        tech_data = result_data.get("technical", {})
        fund_data = result_data.get("fundamental", {})
        
        if not tech_data or not fund_data:
             return {
                "symbol": sym, 
                "error": True, 
                "attention": "Review"
            }

        # Extract Metrics
        ms_data = tech_data.get("market_structure", {}) or {}
        tech_regime = ms_data.get("bias", "NEUTRAL")
        tech_conf = ms_data.get("confidence", "MEDIUM")
        regime_hist = ms_data.get("regime_history", [])

        indicators = tech_data.get("indicators", {}) or {}
        raw_score = indicators.get("technical_score", 50)
        tech_score = raw_score if isinstance(raw_score, (int, float)) else raw_score.get("score", 50)
        
        # Fundamental Scoring
        funda_score_obj = fund_data.get("score", {})
        funda_regime = funda_score_obj.get("grade", "NEUTRAL")
        funda_score = funda_score_obj.get("value", 50)
        
        # 1. ConfluenceAnalysis
        confluence = ConfluenceService.get_confluence_state(tech_regime, funda_regime)
        
        # 2. Composite Scoring
        stability_metrics = RegimeStabilityService.calculate_stability_metrics(
            regime_history=regime_hist,
            current_regime=tech_regime
        )
        composite = CompositeScoringService.calculate_composite_score(
            technical_score=tech_score,
            fundamental_score=funda_score,
            stability_score=stability_metrics["stability_score"]
        )
        composite_val = composite.get("value", 50)
        
        # 3. Risk Assessment
        # Extract latest metrics for risk
        latest_metrics = {}
        if fund_data.get("derived", {}).get("yoy"):
            latest_yoy = fund_data.get("derived", {}).get("yoy", [{}])[0]
            latest_eff = fund_data.get("derived", {}).get("efficiency", [{}])[0]
            latest_metrics = {
                "other_income_ratio": latest_yoy.get("other_income_ratio", 0),
                "roce": latest_eff.get("roce", 0),
                "net_margin_pct": latest_yoy.get("net_margin_pct", 0),
                "net_margin_yoy_delta": latest_yoy.get("net_margin_yoy_delta", 0)
            }
        
        constraints = RiskConstraintService.assess_risk_constraints(
            fundamental_data=latest_metrics,
            technical_data={"regime": tech_regime, "confidence": tech_conf}
        )
        risk_summary = RiskConstraintService.get_risk_summary(constraints)
        
        # Attention Logic
        attention = "STABLE"
        if risk_summary.get("overall_risk") in ["HIGH", "MEDIUM-HIGH"]:
            attention = "CRITICAL"
        elif composite_val >= 70 or confluence.get("state") in ["Early Opportunity", "Emerging Alignment"]:
            attention = "REVIEW"
        elif composite_val < 40:
            attention = "MONITOR"

        key_constraint = constraints[0].get("dimension", "None") if constraints else "None"
        stability_status = "STABLE" if stability_metrics["stability_score"] >= 60 else "UNSTABLE"
        
        portfolio_stock = PortfolioStock(
            symbol=sym,
            confluence_state=confluence.get("state", "Indecision"),
            confluence_fmt=f"{tech_regime} · {funda_regime}".lower(),
            composite_score=composite_val,
            risk_level=risk_summary.get("overall_risk", "LOW"),
            key_constraint=key_constraint,
            attention_flag=attention,
            stability=stability_status
        )
        
        # Cache for 15 minutes
        cache_manager.set(summary_cache_key, portfolio_stock, ttl_seconds=900)
        return portfolio_stock

    except Exception as e:
        return {
            "symbol": sym, 
            "error": str(e),
            "attention": "Review"
        }

@router.post("/summary", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary(input_data: PortfolioInput):
    """Bulk portfolio analysis with parallel execution"""
    symbols = list(set([s.strip().upper() for s in input_data.symbols if s.strip()]))
    if not symbols:
         return PortfolioSummaryResponse(
              summary=PortfolioSummary(total_stocks=0, aligned_strength_pct=0, high_risk_pct=0, attention_distribution={}),
              stocks=[]
          )

    # Process in parallel
    tasks = [analyze_single_stock(sym, input_data.exchange) for sym in symbols]
    results = await asyncio.gather(*tasks)
    
    valid_stocks = []
    distribution = {"CRITICAL": 0, "REVIEW": 0, "MONITOR": 0, "STABLE": 0}
    aligned_count = 0
    high_risk_count = 0

    for res in results:
        if isinstance(res, dict) and res.get("error"):
            continue
            
        if not isinstance(res, PortfolioStock):
            continue
            
        valid_stocks.append(res)
        distribution[res.attention_flag] = distribution.get(res.attention_flag, 0) + 1
        if "Aligned" in res.confluence_state or "Emerging" in res.confluence_state:
            aligned_count += 1
        if "HIGH" in res.risk_level:
            high_risk_count += 1

    total = len(valid_stocks)
    summary = PortfolioSummary(
        total_stocks=total,
        aligned_strength_pct=round((aligned_count/total * 100), 1) if total else 0,
        high_risk_pct=round((high_risk_count/total * 100), 1) if total else 0,
        attention_distribution=distribution
    )

    # Sort
    priority = {"CRITICAL": 0, "REVIEW": 1, "MONITOR": 2, "STABLE": 3}
    valid_stocks.sort(key=lambda x: (priority.get(x.attention_flag, 4), -x.composite_score))

    return PortfolioSummaryResponse(summary=summary, stocks=valid_stocks)
