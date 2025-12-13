"""
LLM service for generating stock analysis
"""
import os
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    import anthropic
except ImportError:
    anthropic = None


class LLMService:
    """Service for generating AI-powered stock analysis"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        
        self.openai_client = None
        self.anthropic_client = None
        
        if OpenAI and self.openai_api_key:
            try:
                # Initialize with only api_key to avoid proxy/other parameter issues
                self.openai_client = OpenAI(api_key=self.openai_api_key.strip())
                logger.info("OpenAI client initialized")
            except TypeError as e:
                # Handle version compatibility issues
                logger.warning(f"OpenAI client initialization failed (version issue): {e}")
                logger.info("OpenAI will use mock analysis. Consider updating: pip install --upgrade openai")
                self.openai_client = None
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
                self.openai_client = None
        
        if anthropic and self.anthropic_api_key:
            try:
                # Initialize with only api_key to avoid proxy/other parameter issues
                self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key.strip())
                logger.info("Anthropic client initialized")
            except TypeError as e:
                # Handle version compatibility issues
                logger.warning(f"Anthropic client initialization failed (version issue): {e}")
                logger.info("Anthropic will use mock analysis. Consider updating: pip install --upgrade anthropic")
                self.anthropic_client = None
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {e}")
                self.anthropic_client = None
        
        if not self.openai_client and not self.anthropic_client:
            logger.warning("No LLM API keys found. Using mock analysis.")
    
    def generate_analysis(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any]
    ) -> str:
        """
        Generate AI-powered stock analysis
        
        Args:
            symbol: Stock symbol
            quote: Current quote data
            indicators: Calculated technical indicators
            
        Returns:
            Plain-language analysis text
        """
        # Prepare prompt
        prompt = self._build_analysis_prompt(symbol, quote, indicators)
        
        # Try OpenAI first, then Anthropic, then mock
        if self.openai_client:
            try:
                return self._generate_with_openai(prompt)
            except Exception as e:
                logger.error(f"OpenAI generation failed: {e}")
        
        if self.anthropic_client:
            try:
                return self._generate_with_anthropic(prompt)
            except Exception as e:
                logger.error(f"Anthropic generation failed: {e}")
        
        # Fallback to mock analysis
        return self._generate_mock_analysis(symbol, quote, indicators)
    
    def _build_analysis_prompt(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any]
    ) -> str:
        """Build the prompt for LLM analysis"""
        prompt = f"""Analyze the following stock data and provide a clear, concise technical analysis in plain language.

Stock Symbol: {symbol}
Current Price: ₹{quote.get('last_price', 'N/A')}
Change: {quote.get('change', 0):.2f} ({quote.get('change_percent', 0):.2f}%)
Open: ₹{quote.get('open', 'N/A')}
High: ₹{quote.get('high', 'N/A')}
Low: ₹{quote.get('low', 'N/A')}
Volume: {quote.get('volume', 'N/A'):,}

Technical Indicators:
- 20-day SMA: ₹{indicators.get('sma_20', 'N/A')}
- 50-day SMA: ₹{indicators.get('sma_50', 'N/A') if indicators.get('sma_50') else 'N/A'}
- Price Trend: {indicators.get('price_trend', 'N/A')}
- Support Levels: ₹{', ₹'.join(map(str, indicators.get('support_levels', [])))}
- Resistance Levels: ₹{', ₹'.join(map(str, indicators.get('resistance_levels', [])))}
- Volume Trend: {indicators.get('volume_analysis', {}).get('volume_trend', 'N/A')}
- Volatility: {indicators.get('volatility', 'N/A')}%

Please provide:
1. A brief overview of the current price action
2. Key technical observations (support/resistance, moving averages, trend)
3. Volume analysis
4. Overall assessment (bullish/bearish/neutral)
5. Key levels to watch

Keep the analysis concise (3-4 paragraphs) and use plain language that's easy to understand."""
        
        return prompt
    
    def _generate_with_openai(self, prompt: str) -> str:
        """Generate analysis using OpenAI"""
        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Using cost-effective model
            messages=[
                {"role": "system", "content": "You are a professional stock market analyst. Provide clear, concise technical analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
    
    def _generate_with_anthropic(self, prompt: str) -> str:
        """Generate analysis using Anthropic Claude"""
        message = self.anthropic_client.messages.create(
            model="claude-3-haiku-20240307",  # Using cost-effective model
            max_tokens=500,
            system="You are a professional stock market analyst. Provide clear, concise technical analysis.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.content[0].text.strip()
    
    def _generate_mock_analysis(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any]
    ) -> str:
        """Generate mock analysis for testing when LLM APIs are not available"""
        current_price = quote.get("last_price", 0)
        sma_20 = indicators.get("sma_20", current_price)
        trend = indicators.get("price_trend", "neutral")
        change_percent = quote.get("change_percent", 0)
        
        analysis = f"""
**Technical Analysis for {symbol}**

**Current Price Action:**
{symbol} is currently trading at ₹{current_price:.2f}, showing a {'gain' if change_percent > 0 else 'loss'} of {abs(change_percent):.2f}% today. 

**Technical Indicators:**
The stock is trading {'above' if current_price > sma_20 else 'below'} its 20-day Simple Moving Average (SMA) of ₹{sma_20:.2f}, indicating a {'bullish' if current_price > sma_20 else 'bearish'} short-term momentum. The overall trend appears to be {trend}.

**Key Levels:**
Support levels are identified at ₹{', ₹'.join(map(str, indicators.get('support_levels', ['N/A'])[:2]))}, while resistance levels are at ₹{', ₹'.join(map(str, indicators.get('resistance_levels', ['N/A'])[:2]))}. These levels should be monitored closely for potential breakouts or breakdowns.

**Volume Analysis:**
Trading volume shows a {indicators.get('volume_analysis', {}).get('volume_trend', 'neutral')} trend, which {'supports' if indicators.get('volume_analysis', {}).get('volume_trend') == 'increasing' else 'may not support'} the current price movement.

**Overall Assessment:**
Based on the technical indicators, {symbol} presents a {trend} outlook. Traders should watch for breaks above resistance or below support levels for confirmation of the trend direction.
"""
        
        return analysis.strip()

