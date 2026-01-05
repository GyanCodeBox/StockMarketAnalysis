"""
Fundamental Analysis Tool
Handles data fetching and financial calculations
"""
import logging
import pandas as pd
from typing import Dict, Any, List
from app.services.fmp_service import FMPService

logger = logging.getLogger(__name__)

class FundamentalTool:
    def __init__(self):
        self.fmp = FMPService()

    async def get_financial_data(self, symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
        """Fetch and process financial performance data only"""
        import asyncio
        tasks = [
            self.fmp.get_income_statement(symbol, exchange, limit=20),
            self.fmp.get_balance_sheet_statement(symbol, exchange, limit=20)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        income_stmt, balance_sheet = results

        if isinstance(income_stmt, Exception) or not income_stmt:
            logger.error(f"Error or no data in income stmt: {income_stmt}")
            return {"error": "No financial data available"}
        
        if isinstance(balance_sheet, Exception):
            logger.error(f"Error in balance sheet: {balance_sheet}")
            balance_sheet = []

        df = pd.DataFrame(income_stmt)
        df['date'] = pd.to_datetime(df['date'])
        
        if balance_sheet:
            bs_df = pd.DataFrame(balance_sheet)
            bs_df['date'] = pd.to_datetime(bs_df['date'])
            df = df.merge(bs_df[['date', 'totalAssets', 'totalCurrentLiabilities']], on='date', how='left')
        
        df = df.sort_values('date', ascending=True).reset_index(drop=True)
        return self._calculate_metrics(df)

    async def get_ownership_data(self, symbol: str, exchange: str = "NSE") -> List[Dict[str, Any]]:
        """Fetch ownership data only"""
        try:
            return await self.fmp.get_institutional_ownership(symbol, exchange)
        except Exception as e:
            logger.error(f"Error fetching ownership: {e}")
            return []

    async def analyze_stock(self, symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
        """
        Perform comprehensive fundamental analysis (Legacy/Wrapper)
        """
        import asyncio
        tasks = [
            self.get_financial_data(symbol, exchange),
            self.get_ownership_data(symbol, exchange)
        ]
        financials, ownership = await asyncio.gather(*tasks)
        
        return {
            "symbol": symbol,
            "exchange": exchange,
            "financials": financials,
            "ownership": ownership
        }

    def _calculate_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate metrics and implement the 3-layer API contract: raw, derived, score
        """
        import numpy as np

        # 1. CLEAN & PREPARE RAW DATA
        cols = ['eps', 'revenue', 'otherIncome', 'netIncome', 'operatingIncome', 'totalAssets', 'totalCurrentLiabilities']
        for col in cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # Ensure we have essential data for calculations
        df['year'] = df['date'].dt.year
        df = df.sort_values('date', ascending=True).reset_index(drop=True)

        # 2. DERIVED METRICS LAYER
        # YoY Calculations (4 periods back)
        df['sales_yoy_pct'] = df['revenue'].pct_change(periods=4) * 100
        df['eps_yoy_pct'] = df['eps'].pct_change(periods=4) * 100
        df['net_income_yoy_pct'] = df['netIncome'].pct_change(periods=4) * 100
        
        # Margins and Other Income
        df['net_margin_pct'] = (df['netIncome'] / df['revenue']) * 100
        df['net_margin_yoy_delta'] = df['net_margin_pct'].diff(periods=4)
        df['other_income_ratio'] = (df['otherIncome'] / df['netIncome']).replace([np.inf, -np.inf], 0).fillna(0)
        df['other_income_3y_avg'] = df['other_income_ratio'].rolling(window=12).mean() # 12 quarters = 3 years

        # 2-Quarter Rolling Averages (Momentum)
        df['sales_rolling_2q'] = df['revenue'].rolling(window=2).mean()
        df['eps_rolling_2q'] = df['eps'].rolling(window=2).mean()
        df['sales_rolling_2q_growth'] = df['sales_rolling_2q'].pct_change() * 100
        df['eps_rolling_2q_growth'] = df['eps_rolling_2q'].pct_change() * 100
        
        # 4-Quarter Rolling (for Breakout Chart)
        df['eps_rolling_4q'] = df['eps'].rolling(window=4).mean()
        df['eps_prior_high'] = df['eps'].expanding().max().shift(1)

        # Trend Arrows (Last 4 Quarters Slope)
        def get_trend_arrow(series):
            if len(series) < 4: return "→"
            vals = series.tail(4).values
            x = np.arange(4)
            slope = np.polyfit(x, vals, 1)[0]
            # Thresholds: > 3% growth in slope is Up, < -3% is Down
            if slope > 3: return "↑"
            if slope < -3: return "↓"
            return "→"

        # These will be sent for the Table
        df['sales_trend_arrow'] = df['revenue'].rolling(window=4).apply(lambda x: 1 if get_trend_arrow(pd.Series(x)) == "↑" else (-1 if get_trend_arrow(pd.Series(x)) == "↓" else 0))
        # Note: polyfit inside rolling apply is slow, better do it once for latest and store in derived.
        # Let's simplify and just compute for the latest window or per row if needed for full history.

        # Capital Efficiency (ROCE)
        if 'totalAssets' in df.columns and 'totalCurrentLiabilities' in df.columns:
            capital_employed = df['totalAssets'] - df['totalCurrentLiabilities']
            capital_employed = capital_employed.replace(0, 1) # Avoid div by zero
            df['roce'] = (df['operatingIncome'] / capital_employed) * 100
        else:
            df['roce'] = None

        # 3. SCORING ENGINE LAYER (Refined)
        latest = df.iloc[-1] if not df.empty else None
        score_obj = {
            "value": 0, 
            "grade": "Neutral", 
            "phase": "Maturity",
            "diagnostic": "",
            "contributors": {}, 
            "warnings": []
        }
        
        if latest is not None:
            # BUCKET 1: Growth Consistency (25%) - Lowered weight to make room for Structure
            sales_growth_yoy = latest.get('sales_yoy_pct', 0)
            eps_growth_yoy = latest.get('eps_yoy_pct', 0)
            
            sales_growth_score = min(max(sales_growth_yoy / 20 * 100, 0), 100)
            eps_growth_score = min(max(eps_growth_yoy / 25 * 100, 0), 100)
            
            # Volatility Penalty (8Q)
            if len(df) >= 8:
                sales_vol = df['sales_yoy_pct'].tail(8).std()
                eps_vol = df['eps_yoy_pct'].tail(8).std()
                vol_penalty = min((sales_vol + eps_vol) / 2, 30)
            else:
                vol_penalty = 0
            
            growth_bucket = ((sales_growth_score * 0.10 + eps_growth_score * 0.15) * 100 / 0.25) 
            growth_bucket = max(growth_bucket - vol_penalty, 0)

            # NEW BUCKET: Earnings Structure (15%)
            # Highs/Lows and Compression
            structure_score = 50 # Start at neutral
            
            # 1. Higher High Check
            is_breakout = latest['eps'] > latest.get('eps_prior_high', 0)
            if is_breakout:
                structure_score += 30
            
            # 2. Sales vs EPS Divergence
            is_divergent = sales_growth_yoy > 10 and eps_growth_yoy < 0
            if is_divergent:
                structure_score -= 40
                score_obj["warnings"].append("Profits lagging revenue growth (Margin squeeze)")
            
            # 3. Flat Structure Detection
            is_compressed = False
            if len(df) >= 4:
                eps_range = (df['eps'].tail(4).max() - df['eps'].tail(4).min()) / (df['eps'].tail(4).mean() or 1)
                if eps_range < 0.1 and sales_growth_yoy > 10:
                    is_compressed = True
                    structure_score -= 20
                    score_obj["warnings"].append("Compression: EPS flat despite sales growth")

            structure_bucket = min(max(structure_score, 0), 100)

            # BUCKET 2: Earnings Quality (20%)
            alignment = 100
            if sales_growth_yoy > 0 and eps_growth_yoy < 0:
                alignment = 30
            
            other_income_ratio = latest.get('other_income_ratio', 0)
            oi_score = 100
            if other_income_ratio > 0.25:
                oi_score = 0
                score_obj["warnings"].append(f"High other income dependency ({round(other_income_ratio*100)}%)")
            elif other_income_ratio > 0.10:
                oi_score = 50
                score_obj["warnings"].append(f"Elevated other income ({round(other_income_ratio*100)}%)")
            
            quality_bucket = (alignment * 0.10 + oi_score * 0.10) * 100 / 0.20

            # BUCKET 3: Profitability (20%)
            margin_val = latest.get('net_margin_pct', 0)
            margin_delta = latest.get('net_margin_yoy_delta', 0)
            margin_score = min(max(margin_val / 15 * 100, 0), 100)
            delta_score = 50 + (margin_delta * 10)
            delta_score = min(max(delta_score, 0), 100)
            profit_bucket = (margin_score * 0.10 + delta_score * 0.10) * 100 / 0.20

            # BUCKET 4: Efficiency (20%)
            roce_val = latest.get('roce', 0) or 0
            roce_score = min(max(roce_val / 20 * 100, 0), 100)
            efficiency_bucket = roce_score

            # Final Weighted Sum
            total_value = (growth_bucket * 0.25 + structure_bucket * 0.15 + quality_bucket * 0.20 + profit_bucket * 0.20 + efficiency_bucket * 0.20) / 100
            score_obj["value"] = round(float(total_value)) if not np.isnan(total_value) else 0
            
            if total_value >= 70: score_obj["grade"] = "Strong"
            elif total_value >= 40: score_obj["grade"] = "Neutral"
            else: score_obj["grade"] = "Weak"
            
            # FUNDAMENTAL PHASE LOGIC
            if sales_growth_yoy > 15 and eps_growth_yoy > 15:
                score_obj["phase"] = "Growth"
            elif is_divergent or (sales_growth_yoy > 5 and eps_growth_yoy < 0):
                score_obj["phase"] = "Compression"
            elif sales_growth_yoy < 0 or eps_growth_yoy < -10:
                score_obj["phase"] = "Deterioration"
            else:
                score_obj["phase"] = "Maturity"

            # GENERATE SUMMARIES (Narrative Signals)
            score_obj["summaries"] = {
                "growth": f"EPS {eps_growth_yoy:+.1f}% | Sales {sales_growth_yoy:+.1f}%",
                "structure": ("Sub-par (EPS below prior peak)" if not is_breakout else "Strong (EPS Breakout reached)") if eps_growth_yoy > 0 else "Weak (Deteriorating structure)",
                "quality": f"{'Healthy' if other_income_ratio < 0.15 else ('Moderate' if other_income_ratio < 0.3 else 'Weak')} (Other income ~{round(other_income_ratio*100)}%)",
                "profitability": f"Net Margin {margin_val:.1f}% ({margin_delta:+.2f} YoY Δ)",
                "efficiency": f"ROCE {roce_val:.1f}% ({'Above' if roce_val > 14 else 'Below'} Cost of Capital)"
            }

            # LEGACY CONTRIBUTORS (Scores for sorting/ranking)
            def format_contributor(bucket, scale=5):
                if np.isnan(bucket): return "0"
                val = round((bucket - 50) / scale)
                return f"{'+' if val > 0 else ''}{val}"

            score_obj["contributors"] = {
                "growth": format_contributor(growth_bucket, 5),
                "structure": format_contributor(structure_bucket, 6),
                "quality": format_contributor(quality_bucket, 5),
                "profitability": format_contributor(profit_bucket, 5),
                "efficiency": format_contributor(efficiency_bucket, 5)
            }

            # DIAGNOSTIC SENTENCE GENERATION
            growth_desc = "strong" if growth_bucket > 70 else ("decelerating" if growth_bucket < 40 else "stable")
            margin_desc = "expanding" if margin_delta > 0.5 else ("contracting" if margin_delta < -0.5 else "steady")
            
            diag = f"Business is in a {score_obj['phase']} phase. "
            if eps_growth_yoy > sales_growth_yoy:
                diag += f"Earnings growth ({round(eps_growth_yoy,1)}%) is outpacing sales, driven by {margin_desc} margins."
            elif is_divergent:
                diag += f"EPS growth is negative despite positive sales, indicating persistent margin pressure."
            else:
                diag += f"Both sales and earnings show {growth_desc} momentum with {margin_desc} ROCE ({round(roce_val,1)}%)."
            
            score_obj["diagnostic"] = diag

        # Data Sanitization for Trend Arrows
        # We compute trend for the latest quarter to avoid polyfit on every row
        def calc_trend_for_latest(series):
            if len(series) < 4: return "→"
            vals = series.tail(4).values
            x = np.arange(4)
            slope = np.polyfit(x, vals, 1)[0]
            avg = series.tail(4).mean() or 1
            rel_slope = slope / avg
            if rel_slope > 0.05: return "↑" # > 5% trend
            if rel_slope < -0.05: return "↓" # < -5% trend
            return "→"
        
        sales_trend = calc_trend_for_latest(df['revenue'])
        eps_trend = calc_trend_for_latest(df['eps'])

        # 4. DATA SANITIZATION & LAYERING
        df = df.replace([np.inf, -np.inf], np.nan)
        df['date'] = df['date'].apply(lambda x: x.strftime('%Y-%m-%d') if pd.notnull(x) else None)
        
        # Create combined period label (Q4 2024, Q3 2024, etc.)
        df['period_label'] = df.apply(
            lambda row: f"{row.get('period', 'Q?')} {int(row.get('calendarYear', 0))}" if pd.notnull(row.get('calendarYear')) else row.get('period', 'Q?'),
            axis=1
        )
        
        df_clean = df.astype(object).where(pd.notnull(df), None)
        
        # Reverse for UI (Latest first)
        df_ui = df_clean.sort_values('date', ascending=False)

        # Layered Return
        return {
            "score": score_obj,
            "raw": {
                "quarterly": df_ui[['date', 'period', 'period_label', 'calendarYear', 'revenue', 'eps', 'netIncome', 'otherIncome', 'operatingIncome']].to_dict(orient='records'),
                "annual": [] # To be implemented in Phase 2
            },
            "derived": {
                "yoy": df_ui[['date', 'period_label', 'sales_yoy_pct', 'eps_yoy_pct', 'net_income_yoy_pct', 'net_margin_pct', 'net_margin_yoy_delta', 'other_income_ratio', 'other_income_3y_avg']].to_dict(orient='records'),
                "momentum": df_ui[['date', 'period_label', 'sales_rolling_2q_growth', 'eps_rolling_2q_growth']].to_dict(orient='records'),
                "efficiency": df_ui[['date', 'period_label', 'roce']].to_dict(orient='records'),
                "structure": {
                    "latest_trends": {"sales": sales_trend, "eps": eps_trend},
                    "historical": df_ui[['date', 'period_label', 'eps_rolling_4q', 'eps_prior_high']].to_dict(orient='records')
                }
            }
        }

