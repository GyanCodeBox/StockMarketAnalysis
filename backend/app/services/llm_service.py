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
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

try:
    import anthropic
    from anthropic import AsyncAnthropic
except ImportError:
    anthropic = None
    AsyncAnthropic = None


class LLMService:
    """Service for generating AI-powered stock analysis"""
    
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        
        self.openai_client = None
        self.anthropic_client = None
        
        if AsyncOpenAI and self.openai_api_key:
            try:
                self.openai_client = AsyncOpenAI(api_key=self.openai_api_key.strip())
                logger.info("Async OpenAI client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Async OpenAI client: {e}")
                self.openai_client = None
        
        if AsyncAnthropic and self.anthropic_api_key:
            try:
                self.anthropic_client = AsyncAnthropic(api_key=self.anthropic_api_key.strip())
                logger.info("Async Anthropic client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Async Anthropic client: {e}")
                self.anthropic_client = None
        
        if not self.openai_client and not self.anthropic_client:
            logger.warning("No LLM API keys found. Using mock analysis.")
    
    async def generate_analysis(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any],
        fundamental_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate AI-powered stock analysis (Async)
        """
        # Prepare prompt
        prompt = self._build_analysis_prompt(symbol, quote, indicators, fundamental_data)
        
        # Try OpenAI first, then Anthropic, then mock
        if self.openai_client:
            try:
                return await self._generate_with_openai(prompt)
            except Exception as e:
                logger.error(f"OpenAI generation failed: {e}")
        
        if self.anthropic_client:
            try:
                return await self._generate_with_anthropic(prompt)
            except Exception as e:
                logger.error(f"Anthropic generation failed: {e}")
        
        # Fallback to mock analysis
        return self._generate_mock_analysis(symbol, quote, indicators, fundamental_data)
    
    def _build_analysis_prompt(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any],
        fundamental_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build the prompt for LLM analysis"""
        vol_analysis = indicators.get('volume_analysis', {})
        avg_vol = vol_analysis.get('average_volume', 'N/A')
        if isinstance(avg_vol, (int, float)):
             avg_vol = f"{avg_vol:,.0f}"
             
        current_vol = quote.get('volume', 0)
        vol_display = f"{current_vol:,}"
        if current_vol == 0:
            vol_display += " (Market likely closed or data unavailable)"

        fundamental_section = ""
        if fundamental_data:
            financials = fundamental_data.get("financials", {})
            cagr = financials.get("cagr", {})
            yearly = financials.get("yearly", [])
            latest_year = yearly[0] if yearly else {}
            
            fundamental_section = f"""
Fundamental Analysis:
- EPS 5-Year CAGR: {cagr.get('eps_5y', 'N/A')}%
- Sales 5-Year CAGR: {cagr.get('sales_5y', 'N/A')}%
- Latest Annual EPS Growth: {latest_year.get('eps_growth', 'N/A'):.2f}%
- Shareholding: Promoter {fundamental_data.get('ownership', [{}])[0].get('percentHeld', 'N/A')}% (approx)
"""

        prompt = f"""Analyze the following stock data and provide a clear, concise combined technical and fundamental analysis in plain language.

Stock Symbol: {symbol}
Current Price: ₹{quote.get('last_price', 'N/A')}
Change: {quote.get('change', 0):.2f} ({quote.get('change_percent', 0):.2f}%)
Volume: {vol_display}

Technical Indicators:
- Price Trend: {indicators.get('price_trend', 'N/A')}
- 20-day SMA: ₹{indicators.get('sma_20', 'N/A')}
- Support: ₹{', ₹'.join(map(str, indicators.get('support_levels', [])))}
- Resistance: ₹{', ₹'.join(map(str, indicators.get('resistance_levels', [])))}
{fundamental_section}

Please provide:
1. A brief overview of the current price action and trend.
2. Fundamental Strength: Comment on growth (CAGR) and recent performance if available.
3. Technical Outlook: Support/resistance and moving averages.
4. Overall assessment (bullish/bearish/neutral) considering BOTH technicals and fundamentals.
5. Key levels to watch.

Keep the analysis concise (3-4 paragraphs), use plain language, and format with Markdown headers."""
        
        return prompt
    
    async def _generate_with_openai(self, prompt: str) -> str:
        """Generate analysis using OpenAI"""
        response = await self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional stock market analyst. Provide clear, concise technical and fundamental analysis."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
    
    async def _generate_with_anthropic(self, prompt: str) -> str:
        """Generate analysis using Anthropic Claude"""
        message = await self.anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            system="You are a professional stock market analyst.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.content[0].text.strip()
    
    def _generate_mock_analysis(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any],
        fundamental_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate mock analysis for testing when LLM APIs are not available"""
        current_price = quote.get("last_price", 0)
        sma_20 = indicators.get("sma_20", current_price)
        trend = indicators.get("price_trend", "neutral")
        change_percent = quote.get("change_percent", 0)
        
        fund_text = ""
        if fundamental_data:
             cagr = fundamental_data.get("financials", {}).get("cagr", {})
             fund_text = f"**Fundamental Insight:**\nThe company shows a 5-year EPS CAGR of {cagr.get('eps_5y', 'N/A')}%, indicating its long-term growth trajectory."

        analysis = f"""
**Combined Analysis for {symbol}**

**Current Price Action:**
{symbol} is currently trading at ₹{current_price:.2f}, showing a {'gain' if change_percent > 0 else 'loss'} of {abs(change_percent):.2f}% today. 

**Technical Logic:**
The stock is trading {'above' if current_price > sma_20 else 'below'} its 20-day Simple Moving Average (SMA) of ₹{sma_20:.2f}, indicating a {'bullish' if current_price > sma_20 else 'bearish'} short-term momentum. The overall trend appears to be {trend}.

{fund_text}

**Key Levels:**
Support levels: ₹{', ₹'.join(map(str, indicators.get('support_levels', ['N/A'])[:2]))}
Resistance levels: ₹{', ₹'.join(map(str, indicators.get('resistance_levels', ['N/A'])[:2]))}

**Overall Assessment:**
Technically {trend}, supported by fundamental growth metrics. Watch for reaction at key levels.
"""
        
        return analysis.strip()

