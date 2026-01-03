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
# We will use the service logic directly where possible to avoid full HTTP overhead if internal
from app.routes import analyze_technical, get_fundamental_financials

router = APIRouter()

class PortfolioInput(BaseModel):
    symbols: List[str] = Field(..., description="List of stock symbols")
    exchange: str = Field(default="NSE", description="Exchange code")

class PortfolioStock(BaseModel):
    symbol: str
    confluence_state: str
    composite_score: float
    risk_level: str
    key_constraint: Optional[str] = None
    stability_status: str
    attention_flag: str
    details: Dict[str, Any] # Expanded metrics for the table

class PortfolioSummary(BaseModel):
    total_stocks: int
    aligned_strength_pct: float
    high_risk_pct: float
    attention_distribution: Dict[str, int]

class PortfolioResponse(BaseModel):
    summary: PortfolioSummary
    stocks: List[PortfolioStock]

@router.post("/summary", response_model=PortfolioResponse)
async def get_portfolio_summary(input_data: PortfolioInput):
    """
    Generate a regime & risk summary for a list of stocks.
    Optimized for bulk processing.
    """
    symbols = list(set([s.strip().upper() for s in input_data.symbols if s.strip()]))
    if not symbols:
         return PortfolioResponse(
             summary=PortfolioSummary(total_stocks=0, aligned_strength_pct=0, high_risk_pct=0, attention_distribution={}),
             stocks=[]
         )

    # Limit to 50 for Phase 2 to ensure performance
    # symbols = symbols[:50] 

    async def analyze_single_stock(sym: str):
        try:
            summary_cache_key = f"portfolio_item:{sym}:{input_data.exchange}"
            cached = cache_manager.get(summary_cache_key)
            if cached:
                return cached

            # Import the AnalyzeRequest from routes (need to move it to a shared place or just import here)
            from app.routes import analyze_summary, AnalyzeRequest
            
            # Construct Request
            req = AnalyzeRequest(
                symbol=sym, 
                exchange=input_data.exchange, 
                timeframe="day",
                mode="metrics_only"
            )
            
            # Call the optimized endpoint logic directly
            # This returns { "structural_data": ..., "technical": ..., "fundamental": ... }
            result_data = await analyze_summary(req)
            
            # DEBUG LOGGING
            print(f"DEBUG [{sym}]: Keys in result_data: {result_data.keys()}")
            
            tech_data = result_data.get("technical", {})
            fund_data = result_data.get("fundamental", {})

            print(f"DEBUG [{sym}]: Tech Data Keys: {tech_data.keys() if tech_data else 'None'}")
            print(f"DEBUG [{sym}]: Fund Data Keys: {fund_data.keys() if fund_data else 'None'}")
            
            if not tech_data or not fund_data:
                 return {
                    "symbol": sym, 
                    "error": True, 
                    "attention": "Review"
                }

            # Extract Metrics
            # Market Structure uses 'bias', not 'current_bias'
            ms_data = tech_data.get("market_structure", {}) or {}
            tech_regime = ms_data.get("bias", "NEUTRAL")
            tech_conf = ms_data.get("confidence", "MEDIUM")
            regime_hist = ms_data.get("regime_history", [])

            # Technical Score is a float in TechnicalTool
            indicators = tech_data.get("indicators", {}) or {}
            raw_score = indicators.get("technical_score", 50)
            tech_score = raw_score if isinstance(raw_score, (int, float)) else raw_score.get("score", 50)
            
            funda_score_obj = fund_data.get("score", {})
            funda_regime = funda_score_obj.get("grade", "NEUTRAL")
            funda_score = funda_score_obj.get("value", 50)
            funda_phase = funda_score_obj.get("phase", "Maturity")
            
            # Latest fundamental for risk
            latest_funda = {}
            if fund_data.get("raw", {}).get("quarterly"):
                latest_derived = fund_data.get("derived", {}).get("yoy", [{}])[0]
                latest_eff = fund_data.get("derived", {}).get("efficiency", [{}])[0]
                latest_funda = {
                    "other_income_ratio": latest_derived.get("other_income_ratio", 0),
                    "roce": latest_eff.get("roce", 0),
                    "net_margin_pct": latest_derived.get("net_margin_pct", 0),
                    "net_margin_yoy_delta": latest_derived.get("net_margin_yoy_delta", 0)
                }

            # Calculation
            confluence = ConfluenceService.get_confluence_state(tech_regime, funda_regime)
            
            tech_stab = RegimeStabilityService.calculate_stability_metrics(regime_hist, tech_regime)
            composite = CompositeScoringService.calculate_composite_score(
                tech_score, funda_score, tech_stab.get("stability_score", 50)
            )
            
            risk_constraints = RiskConstraintService.assess_risk_constraints(
                latest_funda, {"regime": tech_regime, "confidence": tech_conf}
            )
            risk_summary = RiskConstraintService.get_risk_summary(risk_constraints)
            
            # Attention Logic (PRD 7.1)
            attention = "STABLE"
            risk_level_str = "LOW"
            if risk_summary.get("severity") == "HIGH": risk_level_str = "HIGH"
            elif risk_summary.get("severity") == "MEDIUM": risk_level_str = "MEDIUM"

            high_risk_count = len([c for c in risk_constraints if c['severity'] == 'HIGH'])
            
            if high_risk_count >= 2:
                attention = "CRITICAL"
            elif confluence['state'] in ["Structural Risk", "Drift Risk"]:
                attention = "REVIEW"
            elif composite < 50 or tech_stab.get("stability_score", 50) < 40: # Stability threshold example
                attention = "MONITOR"
            else:
                attention = "STABLE"

            result = {
                "symbol": sym,
                "confluence_state": confluence['state'],
                "composite_score": composite,
                "risk_level": risk_level_str,
                "key_constraint": risk_constraints[0]['name'] if risk_constraints else None,
                "stability_status": "Stable" if tech_stab.get("stability_score", 0) > 60 else "Unstable",
                "attention_flag": attention,
                "details": {
                    "tech_regime": tech_regime,
                    "funda_regime": funda_regime,
                    "confluence_fmt": f"{confluence['technical_regime']} + {confluence['fundamental_regime']}",
                }
            }
            
            cache_manager.set(summary_cache_key, result, ttl_seconds=300)
            return result

        except Exception as e:
            print(f"CRITICAL PORTFOLIO ERROR: {e}")
            import traceback
            traceback.print_exc()
            return {"symbol": sym, "error": str(e), "attention": "Critical"}

    # Run all analyses in parallel
    tasks = [analyze_single_stock(sym) for sym in symbols]
    results = await asyncio.gather(*tasks)
    
    # Filter valid results
    valid_stocks = []
    
    # Aggregation Stats
    distribution = {"CRITICAL": 0, "REVIEW": 0, "MONITOR": 0, "STABLE": 0}
    aligned_count = 0
    high_risk_count = 0
    
    for res in results:
        if "error" in res and res.get("error") is True: 
            # Could handle errors gracefully
            continue
            
        stock_obj = PortfolioStock(
            symbol=res["symbol"],
            confluence_state=res.get("confluence_state", "Unknown"),
            composite_score=res.get("composite_score", 0),
            risk_level=res.get("risk_level", "LOW"),
            key_constraint=res.get("key_constraint"),
            stability_status=res.get("stability_status", "Stable"),
            attention_flag=res.get("attention_flag", "MONITOR"),
            details=res.get("details", {})
        )
        valid_stocks.append(stock_obj)
        
        # Stats
        distribution[stock_obj.attention_flag] = distribution.get(stock_obj.attention_flag, 0) + 1
        if "Aligned" in stock_obj.confluence_state:
            aligned_count += 1
        if stock_obj.risk_level == "HIGH":
            high_risk_count += 1
            
    total = len(valid_stocks)
    summary = PortfolioSummary(
        total_stocks=total,
        aligned_strength_pct=round((aligned_count/total * 100), 1) if total else 0,
        high_risk_pct=round((high_risk_count/total * 100), 1) if total else 0,
        attention_distribution=distribution
    )
    
    # Sort: Critical -> Review -> Monitor -> Stable, then by Score asc
    priority_map = {"CRITICAL": 0, "REVIEW": 1, "MONITOR": 2, "STABLE": 3}
    valid_stocks.sort(key=lambda x: (priority_map.get(x.attention_flag, 4), x.composite_score))
    
    return PortfolioResponse(summary=summary, stocks=valid_stocks)
