"""
Financial Modeling Prep (FMP) API Service
"""
import os
import requests
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class FMPService:
    BASE_URL = "https://financialmodelingprep.com/api/v3"

    def __init__(self):
        self.api_key = os.getenv("FMP_API_KEY")
        if not self.api_key:
            logger.warning("FMP_API_KEY not found in environment variables. Fundamental analysis will not work.")

    def _format_symbol(self, symbol: str, exchange: str = "NSE") -> str:
        """
        Format symbol for FMP API (e.g., RELIANCE -> RELIANCE.NS)
        Apps uses 'NSE' and 'BSE'. FMP uses '.NS' and '.BO'.
        US stocks (exchange='NASDAQ'/'NYSE') usually use the symbol directly.
        """
        symbol = symbol.upper()
        if exchange == "NSE":
            if not symbol.endswith(".NS"):
                return f"{symbol}.NS"
        elif exchange == "BSE":
            if not symbol.endswith(".BO"):
                return f"{symbol}.BO"
        # Add more logic for other exchanges if needed
        return symbol

    def get_income_statement(self, symbol: str, exchange: str = "NSE", limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch quarterly income statement
        Endpoint: /income-statement/{symbol}?period=quarter&limit={limit}
        """
        fmp_symbol = self._format_symbol(symbol, exchange)
        
        if self.api_key:
            url = f"{self.BASE_URL}/income-statement/{fmp_symbol}"
            params = {
                "period": "quarter",
                "limit": limit,
                "apikey": self.api_key
            }
            try:
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and data:
                        return data
                    if isinstance(data, dict) and "Error Message" in data:
                        logger.warning(f"FMP API Error: {data['Error Message']}")
                else:
                    logger.warning(f"FMP API Request failed: {response.status_code} - {response.text}")
            except Exception as e:
                logger.error(f"Error fetching income statement for {fmp_symbol}: {e}")

        logger.info(f"Using MOCK income statement data for {symbol}")
        return self._get_mock_income_statement(symbol, limit)

    def get_institutional_ownership(self, symbol: str, exchange: str = "NSE") -> List[Dict[str, Any]]:
        """
        Fetch institutional ownership
        Endpoint: /institutional-holder/{symbol}
        """
        fmp_symbol = self._format_symbol(symbol, exchange)
        
        if self.api_key:
            url = f"{self.BASE_URL}/institutional-holder/{fmp_symbol}"
            params = {"apikey": self.api_key}
            try:
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and data:
                        return data
                else:
                    logger.warning(f"FMP Ownership Request failed: {response.status_code}")
            except Exception as e:
                logger.error(f"Error fetching ownership for {fmp_symbol}: {e}")

        logger.info(f"Using MOCK ownership data for {symbol}")
        return self._get_mock_ownership(symbol)

    def _get_mock_income_statement(self, symbol: str, limit: int) -> List[Dict[str, Any]]:
        """Generate mock quarterly income statement data"""
        import random
        from datetime import datetime, timedelta
        
        data = []
        # Base figures
        revenue = random.uniform(50000, 200000) * 1000000 # 50B - 200B
        eps = random.uniform(10, 50)
        
        current_date = datetime.now()
        
        for i in range(limit):
            # Go back by quarters (approx 90 days)
            date = current_date - timedelta(days=90*i)
            year = date.year
            month = date.month
            
            # Determine quarter
            q = (month - 1) // 3 + 1
            period = f"Q{q}"
            
            # Add some volatility
            rev_var = random.uniform(0.95, 1.05)
            eps_var = random.uniform(0.90, 1.10)
            
            revenue *= rev_var
            eps *= eps_var
            
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "symbol": symbol,
                "revenue": int(revenue),
                "costOfRevenue": int(revenue * 0.6),
                "grossProfit": int(revenue * 0.4),
                "operatingIncome": int(revenue * 0.20),  # EBIT proxy
                "netIncome": int(revenue * 0.15),
                "eps": round(eps, 2),
                "epsdiluted": round(eps, 2),
                "otherIncome": int(revenue * 0.05),
                "period": period,
                "calendarYear": str(year)
            })
            
        return data

    def _get_mock_ownership(self, symbol: str) -> List[Dict[str, Any]]:
        """Generate mock shareholding pattern"""
        return [
            {"holder": "Promoters", "shares": 50000000, "percentHeld": 50.5, "dateReported": "2024-09-30"},
            {"holder": "Foreign Institutions", "shares": 25000000, "percentHeld": 23.4, "dateReported": "2024-09-30"},
            {"holder": "Domestic Institutions", "shares": 15000000, "percentHeld": 15.2, "dateReported": "2024-09-30"},
            {"holder": "Public", "shares": 10000000, "percentHeld": 10.9, "dateReported": "2024-09-30"}
        ]

    def get_key_metrics(self, symbol: str, exchange: str = "NSE", limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch key metrics (optional, for supplementary data)
        Endpoint: /key-metrics/{symbol}?period=quarter&limit={limit}
        """
        if not self.api_key:
            return []

        fmp_symbol = self._format_symbol(symbol, exchange)
        url = f"{self.BASE_URL}/key-metrics/{fmp_symbol}"
        params = {
            "period": "quarter",
            "limit": limit,
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data if isinstance(data, list) else []
        except Exception as e:
            logger.error(f"Error fetching key metrics for {fmp_symbol}: {e}")
            return []

    def get_balance_sheet_statement(self, symbol: str, exchange: str = "NSE", limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch quarterly balance sheet statement
        Endpoint: /balance-sheet-statement/{symbol}?period=quarter&limit={limit}
        """
        fmp_symbol = self._format_symbol(symbol, exchange)
        
        if self.api_key:
            url = f"{self.BASE_URL}/balance-sheet-statement/{fmp_symbol}"
            params = {
                "period": "quarter",
                "limit": limit,
                "apikey": self.api_key
            }
            try:
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and data:
                        return data
                    if isinstance(data, dict) and "Error Message" in data:
                        logger.warning(f"FMP API Error: {data['Error Message']}")
                else:
                    logger.warning(f"FMP Balance Sheet Request failed: {response.status_code} - {response.text}")
            except Exception as e:
                logger.error(f"Error fetching balance sheet for {fmp_symbol}: {e}")

        logger.info(f"Using MOCK balance sheet data for {symbol}")
        return self._get_mock_balance_sheet(symbol, limit)

    def _get_mock_balance_sheet(self, symbol: str, limit: int) -> List[Dict[str, Any]]:
        """Generate mock quarterly balance sheet data"""
        import random
        from datetime import datetime, timedelta
        
        data = []
        # Base figures
        total_assets = random.uniform(200000, 500000) * 1000000 
        current_liabilities = total_assets * random.uniform(0.2, 0.4)
        
        current_date = datetime.now()
        
        for i in range(limit):
            # Go back by quarters (approx 90 days)
            date = current_date - timedelta(days=90*i)
            year = date.year
            month = date.month
            
            # Determine quarter
            q = (month - 1) // 3 + 1
            period = f"Q{q}"
            
            # Add some volatility
            asset_growth = random.uniform(0.98, 1.02)
            total_assets *= asset_growth
            current_liabilities = total_assets * random.uniform(0.2, 0.4)
            
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "symbol": symbol,
                "totalAssets": int(total_assets),
                "totalCurrentLiabilities": int(current_liabilities),
                "period": period,
                "calendarYear": str(year)
            })
            
        return data
