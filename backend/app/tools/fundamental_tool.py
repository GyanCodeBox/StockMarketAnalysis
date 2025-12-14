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

    def analyze_stock(self, symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
        """
        Perform comprehensive fundamental analysis
        """
        # 1. Fetch Data
        income_stmt = self.fmp.get_income_statement(symbol, exchange, limit=20) # 5 years
        balance_sheet = self.fmp.get_balance_sheet_statement(symbol, exchange, limit=20)
        ownership = self.fmp.get_institutional_ownership(symbol, exchange)

        if not income_stmt:
            return {"error": "No financial data available"}

        # 2. Process Data (Convert to DataFrame for easier calc)
        df = pd.DataFrame(income_stmt)
        # Ensure date is datetime FIRST
        df['date'] = pd.to_datetime(df['date'])
        
        # Merge balance sheet if available
        if balance_sheet:
            bs_df = pd.DataFrame(balance_sheet)
            # Merge on date
            bs_df['date'] = pd.to_datetime(bs_df['date'])
            df = df.merge(bs_df[['date', 'totalAssets', 'totalCurrentLiabilities']], on='date', how='left')
        
        # Sort ascending
        df = df.sort_values('date', ascending=True).reset_index(drop=True)

        # 3. Calculate Metrics
        metrics = self._calculate_metrics(df)
        
        # 4. Structure Output
        return {
            "symbol": symbol,
            "exchange": exchange,
            "financials": metrics,
            "ownership": ownership,
            "raw_data": income_stmt # Optional, if needed by frontend directly
        }

    def _calculate_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate Step-by-Step Growth and Averages
        """
        # Ensure numeric columns
        cols = ['eps', 'revenue', 'otherIncome', 'netIncome', 'operatingIncome', 'totalAssets', 'totalCurrentLiabilities']
        for col in cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # Net Profit Margin %
        df['net_margin'] = (df['netIncome'] / df['revenue']) * 100

        # Other Income as % of Net Income
        df['other_income_pct'] = (df['otherIncome'] / df['netIncome']) * 100
        
        # 2-Quarter Rolling Averages (for absolute values)
        df['eps_rolling_2q'] = df['eps'].rolling(window=2).mean()
        df['sales_rolling_2q'] = df['revenue'].rolling(window=2).mean()

        # 2-Quarter Rolling Growth % (for Chart 4)
        # Rolling 2Q EPS Growth % = pct_change of rolling 2Q EPS
        df['eps_rolling_2q_growth'] = df['eps_rolling_2q'].pct_change() * 100
        df['sales_rolling_2q_growth'] = df['sales_rolling_2q'].pct_change() * 100

        # Growth Rates (QoQ and YoY)
        df['eps_qoq'] = df['eps'].pct_change(periods=1) * 100
        df['sales_qoq'] = df['revenue'].pct_change(periods=1) * 100
        df['net_income_qoq'] = df['netIncome'].pct_change(periods=1) * 100
        
        # YoY (4 periods ago)
        df['eps_yoy'] = df['eps'].pct_change(periods=4) * 100
        df['sales_yoy'] = df['revenue'].pct_change(periods=4) * 100

        # ROCE Calculation: EBIT / (Total Assets - Current Liabilities)
        # Using operatingIncome as proxy for EBIT
        if 'totalAssets' in df.columns and 'totalCurrentLiabilities' in df.columns:
            capital_employed = df['totalAssets'] - df['totalCurrentLiabilities']
            # Avoid division by zero
            capital_employed = capital_employed.replace(0, 1)
            df['roce'] = (df['operatingIncome'] / capital_employed) * 100
        else:
            df['roce'] = None

        # Yearly Aggregation (Group by Year)
        df['year'] = df['date'].dt.year
        yearly_df = df.groupby('year').agg({
            'eps': 'sum',
            'revenue': 'sum'
        }).reset_index()
        
        # Yearly Growth
        yearly_df['eps_growth'] = yearly_df['eps'].pct_change() * 100

        # CAGR (5 Year)
        eps_cagr = 0
        sales_cagr = 0
        if len(yearly_df) >= 5:
            start_eps = yearly_df.iloc[-5]['eps']
            end_eps = yearly_df.iloc[-1]['eps']
            if start_eps > 0 and end_eps > 0:
                eps_cagr = ((end_eps / start_eps) ** (1/5) - 1) * 100
                
            start_sales = yearly_df.iloc[-5]['revenue']
            end_sales = yearly_df.iloc[-1]['revenue']
            if start_sales > 0 and end_sales > 0:
                sales_cagr = ((end_sales / start_sales) ** (1/5) - 1) * 100

        # DATA SANITIZATION FOR JSON
        # 1. Replace Inf/-Inf with NaN
        import numpy as np
        df = df.replace([np.inf, -np.inf], np.nan)
        yearly_df = yearly_df.replace([np.inf, -np.inf], np.nan)

        # 2. Convert NaN to None (valid JSON null)
        # Also ensure 'date' is string, not Timestamp
        if 'date' in df.columns:
             df['date'] = df['date'].apply(lambda x: x.strftime('%Y-%m-%d') if pd.notnull(x) else None)
        
        # KEY FIX: Cast to object ensures None is preserved and not coerced back to NaN
        df_obj = df.astype(object).where(pd.notnull(df), None)
        yearly_obj = yearly_df.astype(object).where(pd.notnull(yearly_df), None)
             
        quarterly_data = df_obj.sort_values('date', ascending=False).to_dict(orient='records')
        yearly_data = yearly_obj.sort_values('year', ascending=False).to_dict(orient='records')
        
        # 3. Ensure no numpy types in list of dicts (pandas to_dict usually handles this but being safe)
        # (Already handled by to_dict usually, but let's trust it for now after Inf removal)

        return {
            "quarterly": quarterly_data,
            "yearly": yearly_data,
            "cagr": {
                "eps_5y": round(float(eps_cagr), 2),
                "sales_5y": round(float(sales_cagr), 2)
            }
        }
