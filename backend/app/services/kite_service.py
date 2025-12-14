"""
Kite Connect API service for fetching stock data
"""
import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    from kiteconnect import KiteConnect
except ImportError:
    logger.warning("kiteconnect not installed. Using mock data.")
    KiteConnect = None


class KiteService:
    """Service for interacting with Kite Connect API"""
    
    def __init__(self):
        self.api_key = os.getenv("KITE_API_KEY", "")
        self.api_secret = os.getenv("KITE_API_SECRET", "")
        self.access_token = os.getenv("KITE_ACCESS_TOKEN", "")
        
        self.kite = None
        self.token_valid = False
        self._instrument_cache = {}  # Cache for instrument tokens: {(exchange, symbol): token}
        
        if KiteConnect and self.api_key and self.access_token:
            try:
                self.kite = KiteConnect(api_key=self.api_key)
                self.kite.set_access_token(self.access_token)
                # Try a simple API call to validate token
                try:
                    self.kite.profile()
                    self.token_valid = True
                    logger.info("Kite Connect initialized successfully with valid token")
                except Exception as token_error:
                    error_msg = str(token_error).lower()
                    if "invalid token" in error_msg or "token" in error_msg:
                        logger.warning(f"Kite Connect token is invalid: {token_error}")
                        logger.info("Falling back to mock data. Update KITE_ACCESS_TOKEN in .env (see KITE_TOKEN_GUIDE.md)")
                        self.kite = None  # Disable Kite client, use mock data
                    else:
                        # Other error, but token might be OK, keep client
                        logger.warning(f"Token validation check failed: {token_error}")
                        self.token_valid = True
            except Exception as e:
                logger.warning(f"Failed to initialize Kite Connect: {e}")
                self.kite = None
        else:
            if not self.api_key:
                logger.info("KITE_API_KEY not found. Using mock data.")
            elif not self.access_token:
                logger.info("KITE_ACCESS_TOKEN not found. Using mock data.")
            else:
                logger.info("Kite Connect not available. Using mock data.")
    
    def get_quote(self, symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
        """
        Get current quote for a symbol
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            exchange: Exchange code (NSE, BSE)
            
        Returns:
            Dictionary with quote data
        """
        instrument = f"{exchange}:{symbol}"
        
        if self.kite:
            try:
                quote_data = self.kite.quote(instrument)
                if instrument in quote_data:
                    quote = quote_data[instrument]
                    return {
                        "symbol": symbol,
                        "exchange": exchange,
                        "last_price": quote.get("last_price", 0),
                        "open": quote.get("ohlc", {}).get("open", 0),
                        "high": quote.get("ohlc", {}).get("high", 0),
                        "low": quote.get("ohlc", {}).get("low", 0),
                        "close": quote.get("ohlc", {}).get("close", 0),
                        "volume": quote.get("volume", 0),
                        "change": quote.get("net_change", 0),
                        "change_percent": quote.get("net_change", 0) / quote.get("ohlc", {}).get("close", 1) * 100 if quote.get("ohlc", {}).get("close", 0) else 0,
                        "timestamp": datetime.now().isoformat()
                    }
            except Exception as e:
                error_msg = str(e).lower()
                # Check for authentication/token errors
                if "invalid token" in error_msg or "token" in error_msg or "unauthorized" in error_msg or "authentication" in error_msg:
                    logger.warning(f"Kite API authentication failed ({e}). Falling back to mock data.")
                    logger.info("To use real data, update KITE_ACCESS_TOKEN in .env file. See KITE_TOKEN_GUIDE.md")
                    # Disable Kite client to prevent further attempts
                    self.kite = None
                else:
                    logger.warning(f"Error fetching quote from Kite: {e}. Falling back to mock data.")
                # Fall through to mock data instead of raising
        
        # Mock data for development/testing
        return self._get_mock_quote(symbol, exchange)
    
    def get_ohlc(self, symbol: str, exchange: str = "NSE", days: int = 30, interval: str = "day") -> Dict[str, Any]:
        """
        Get historical OHLC data
        
        Args:
            symbol: Stock symbol
            exchange: Exchange code
            days: Number of days of historical data
            interval: Data interval ('day', 'week', 'hour')
            
        Returns:
            Dictionary with OHLC data
        """
        instrument = f"{exchange}:{symbol}"
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days)
        
        kite_interval = "day"
        if interval == "hour":
            kite_interval = "60minute"  # Kite 60min interval
        elif interval == "week":
            kite_interval = "day"  # We fetch daily and resample
            
        if self.kite:
            try:
                # Get instrument token - if None, we'll use instrument string instead
                instrument_token = self._get_instrument_token(symbol, exchange)
                
                # If we don't have instrument token, try using instrument string
                # Note: This is a fallback - ideally we'd have the token
                if instrument_token is None:
                    logger.debug(f"Instrument token not found for {symbol}, using mock data")
                    # Fall through to mock data
                else:
                    # Fetch historical data
                    historical_data = self.kite.historical_data(
                        instrument_token=instrument_token,
                        from_date=from_date,
                        to_date=to_date,
                        interval=kite_interval
                    )
                    
                    if historical_data:
                        # Resample to weekly if requested
                        if interval == "week":
                            historical_data = self._resample_to_weekly(historical_data)
                            
                        return {
                            "symbol": symbol,
                            "exchange": exchange,
                            "data": historical_data,
                            "from_date": from_date.isoformat(),
                            "to_date": to_date.isoformat(),
                            "interval": interval
                        }
                    

            except Exception as e:
                error_msg = str(e).lower()
                # Check for authentication/token errors
                if "invalid token" in error_msg or "token" in error_msg or "unauthorized" in error_msg or "authentication" in error_msg:
                    logger.warning(f"Kite API authentication failed ({e}). Falling back to mock data.")
                    logger.info("To use real data, update KITE_ACCESS_TOKEN in .env file. See KITE_TOKEN_GUIDE.md")
                    # Disable Kite client to prevent further attempts
                    self.kite = None
                else:
                    logger.warning(f"Error fetching OHLC from Kite: {e}. Falling back to mock data.")
                # Fall through to mock data instead of raising
        
        
        # Mock data for development/testing
        result = self._get_mock_ohlc(symbol, exchange, days)
        
        # Apply resampling to mock data if needed
        if interval == "week" and result.get("data"):
            result["data"] = self._resample_to_weekly(result["data"])
            
        result["interval"] = interval
        return result

    def _resample_to_weekly(self, daily_data: list) -> list:
        """Resample daily OHLC data to weekly (Pure Python)"""
        if not daily_data:
            return []
            
        try:
            # Sort data by date just in case
            daily_data.sort(key=lambda x: x['date'])
            
            resampled = []
            current_week_data = []
            
            from datetime import datetime, timedelta
            
            def get_week_start(date_str):
                # ISO format to datetime
                try:
                    dt = datetime.fromisoformat(date_str)
                except:
                    # Handle Z suffix or other formats if needed, but assuming ISO from kite/mock
                    dt = datetime.strptime(date_str.split('T')[0], "%Y-%m-%d")
                    
                # Get Monday of the week
                return dt - timedelta(days=dt.weekday())

            current_week_start = None
            
            for candle in daily_data:
                candle_date = candle['date']
                date_obj = None
                if isinstance(candle_date, str):
                    try:
                        date_obj = datetime.fromisoformat(candle_date)
                    except:
                         try:
                             date_obj = datetime.strptime(candle_date.split('T')[0], "%Y-%m-%d")
                         except:
                             continue # Skip invalid dates
                elif isinstance(candle_date, datetime):
                    date_obj = candle_date
                else:
                    continue

                # Simply group by ISO calendar week (year, week_num)
                iso_year, iso_week, _ = date_obj.isocalendar()
                week_key = (iso_year, iso_week)
                
                if current_week_start != week_key:
                    if current_week_data:
                        # Process previous week
                        resampled.append(self._aggregate_week(current_week_data))
                    
                    current_week_start = week_key
                    current_week_data = []
                
                current_week_data.append(candle)
            
            # Process last week
            if current_week_data:
                resampled.append(self._aggregate_week(current_week_data))
                
            return resampled
            
        except Exception as e:
            logger.error(f"Resampling error: {e}")
            return daily_data

    def _aggregate_week(self, week_data: list) -> dict:
        """Helper to aggregate a list of daily candles into one weekly candle"""
        if not week_data:
            return {}
            
        first = week_data[0]
        last = week_data[-1]
        
        # Determine date: use the last candle's date
        last_date = last["date"]
        date_str = ""
        if isinstance(last_date, datetime):
            date_str = last_date.isoformat()
        else:
            date_str = str(last_date)

        high = max(d.get('high', 0) for d in week_data)
        low = min(d.get('low', float('inf')) for d in week_data)
        volume = sum(d.get('volume', 0) for d in week_data)
        
        return {
            "date": date_str,
            "open": first.get("open", 0),
            "high": high,
            "low": low,
            "close": last.get("close", 0),
            "volume": volume
        }
    
    def _get_instrument_token(self, symbol: str, exchange: str) -> Optional[int]:
        """
        Get instrument token for a symbol using Kite API (with caching)
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            exchange: Exchange code (NSE, BSE)
            
        Returns:
            Instrument token (integer) or None if not found
        """
        if not self.kite:
            return None
        
        # Check cache first
        cache_key = (exchange, symbol)
        if cache_key in self._instrument_cache:
            return self._instrument_cache[cache_key]
        
        try:
            # Kite API: Get instruments for the exchange
            # This returns a list of all instruments
            instruments = self.kite.instruments(exchange)
            
            # Find the instrument matching our symbol
            instrument_code = f"{exchange}:{symbol}"
            
            for instrument in instruments:
                # Match by tradingsymbol and exchange
                if (instrument.get("tradingsymbol") == symbol and 
                    instrument.get("exchange") == exchange):
                    token = instrument.get("instrument_token")
                    if token:
                        token_int = int(token)
                        # Cache it for future use
                        self._instrument_cache[cache_key] = token_int
                        logger.debug(f"Found instrument token {token_int} for {instrument_code}")
                        return token_int
            
            logger.warning(f"Instrument token not found for {instrument_code}")
            # Cache None to avoid repeated lookups
            self._instrument_cache[cache_key] = None
            return None
            
        except Exception as e:
            logger.error(f"Error fetching instrument token for {symbol}: {e}")
            return None
    
    def _get_mock_quote(self, symbol: str, exchange: str) -> Dict[str, Any]:
        """Generate mock quote data for testing"""
        import random
        base_price = random.uniform(100, 5000)
        change = random.uniform(-50, 50)
        
        return {
            "symbol": symbol,
            "exchange": exchange,
            "last_price": round(base_price, 2),
            "open": round(base_price - change, 2),
            "high": round(base_price + abs(change), 2),
            "low": round(base_price - abs(change), 2),
            "close": round(base_price, 2),
            "volume": random.randint(1000000, 10000000),
            "change": round(change, 2),
            "change_percent": round((change / base_price) * 100, 2),
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_mock_ohlc(self, symbol: str, exchange: str, days: int) -> Dict[str, Any]:
        """Generate mock OHLC data for testing"""
        import random
        base_price = random.uniform(100, 5000)
        data = []
        
        for i in range(days, 0, -1):
            date = datetime.now() - timedelta(days=i)
            price_change = random.uniform(-20, 20)
            open_price = base_price + price_change
            close_price = open_price + random.uniform(-10, 10)
            high_price = max(open_price, close_price) + random.uniform(0, 10)
            low_price = min(open_price, close_price) - random.uniform(0, 10)
            
            data.append({
                "date": date.date().isoformat(),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": random.randint(1000000, 10000000)
            })
            
            base_price = close_price
        
        return {
            "symbol": symbol,
            "exchange": exchange,
            "data": data,
            "from_date": (datetime.now() - timedelta(days=days)).isoformat(),
            "to_date": datetime.now().isoformat()
        }

    def search_symbols(self, query: str, exchange: str = "NSE") -> list[Dict[str, Any]]:
        """
        Search for symbols matching the query
        
        Args:
            query: Search query string
            exchange: Exchange to search in
            
        Returns:
            List of matching instruments
        """
        if not query:
            return []
            
        query = query.upper()
        results = []
        
        if self.kite:
            try:
                # Get all instruments for the exchange
                # Ideally we should cache this list as it's large and doesn't change often during the day
                cache_key = f"all_instruments_{exchange}"
                
                if not hasattr(self, '_all_instruments_cache'):
                    self._all_instruments_cache = {}
                
                if cache_key not in self._all_instruments_cache:
                    logger.info(f"Fetching all instruments for {exchange} to cache")
                    self._all_instruments_cache[cache_key] = self.kite.instruments(exchange)
                
                instruments = self._all_instruments_cache[cache_key]
                
                # Filter locally
                count = 0
                for instrument in instruments:
                    if count >= 10:  # Limit results
                        break
                        
                    tradingsymbol = instrument.get("tradingsymbol", "")
                    name = instrument.get("name", "")
                    
                    if query in tradingsymbol or (name and query in name.upper()):
                        results.append({
                            "symbol": tradingsymbol,
                            "name": name,
                            "exchange": exchange,
                            "instrument_token": instrument.get("instrument_token")
                        })
                        count += 1
                        
                return results
                
            except Exception as e:
                logger.error(f"Error searching symbols in Kite: {e}")
                # Fall through to mock
        
        # Mock search results
        mock_companies = [
            ("RELIANCE", "Reliance Industries"),
            ("TCS", "Tata Consultancy Services"),
            ("INFY", "Infosys"),
            ("HDFCBANK", "HDFC Bank"),
            ("ICICIBANK", "ICICI Bank"),
            ("BHARTIARTL", "Bharti Airtel"),
            ("SBIN", "State Bank of India"),
            ("ITC", "ITC Limited"),
            ("LT", "Larsen & Toubro"),
            ("HINDUNILVR", "Hindustan Unilever")
        ]
        
        for symbol, name in mock_companies:
            if query in symbol or (name and query in name.upper()):
                results.append({
                    "symbol": symbol,
                    "name": name,
                    "exchange": exchange,
                    "instrument_token": 0
                })
        
        return results

