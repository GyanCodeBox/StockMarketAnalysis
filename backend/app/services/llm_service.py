"""
LLM service for generating stock analysis
"""
import os
import logging
import json
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from app.utils.llm_schema_validator import validate_decision_brief

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
        fundamental_data: Optional[Dict[str, Any]] = None,
        mode: str = "full"
    ) -> str:
        """
        Generate AI-powered stock analysis (Async)
        
        Args:
            mode: "full" (default) or "metrics_only" to skip LLM text generation
        """
        if mode == "metrics_only":
            return ""

        # Try OpenAI first, then Anthropic, then mock
        brief_modes = ["decision_brief", "technical_brief", "fundamental_brief"]
        if mode in brief_modes:
            if mode == "technical_brief":
                prompt = self._build_technical_brief_prompt(symbol, quote, indicators)
            elif mode == "fundamental_brief":
                prompt = self._build_fundamental_brief_prompt(symbol, quote, fundamental_data)
            else:
                prompt = self._build_decision_brief_prompt(symbol, quote, indicators, fundamental_data)
            
            for attempt in range(3):  # Original + 2 retries
                try:
                    raw_response = ""
                    if self.openai_client:
                        raw_response = await self._generate_with_openai(prompt, is_json=True)
                    elif self.anthropic_client:
                        raw_response = await self._generate_with_anthropic(prompt)
                    else:
                        return self._generate_mock_analysis(symbol, quote, indicators, fundamental_data, mode=mode)
                    
                    # Extract JSON (in case LLM included text around it)
                    json_str = raw_response
                    if "{" in raw_response:
                        json_str = raw_response[raw_response.find("{"):raw_response.rfind("}")+1]
                    
                    data = json.loads(json_str)
                    validated_data = validate_decision_brief(data)
                    return json.dumps(validated_data)
                except Exception as e:
                    logger.warning(f"{mode} attempt {attempt + 1} failed: {e}")
                    if attempt == 2:
                        logger.error(f"Critical: {mode} synthesis failed after 3 attempts. Last error: {e}")
                        return json.dumps({
                            "headline": f"Institutional {mode.replace('_', ' ').title()} Unavailable",
                            "primary_observation": "Intelligence compression engine encountered a structural validation error.",
                            "dominant_risk": f"Data constraint violation: {str(e).split(':')[-1].strip()}",
                            "monitoring_points": ["System logs for service health", "Direct metric panels for raw data"],
                            "confidence_note": "Technical error in synthesis layer. Refer to quantitative indices."
                        })
            return ""

        # Prepare prompt for full mode
        prompt = self._build_analysis_prompt(symbol, quote, indicators, fundamental_data)
        
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
- Latest Annual EPS Growth: {latest_year.get('eps_growth', 'N/A') if isinstance(latest_year.get('eps_growth'), (int, float)) else latest_year.get('eps_growth', 'N/A')}%
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

    def _build_technical_brief_prompt(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any]
    ) -> str:
        """Build a strict schema-based prompt for technical intelligence."""
        ms = indicators.get('market_structure', {})
        tech_score_obj = indicators.get('technical_score', {})
        tech_score = tech_score_obj.get('score', 'N/A')
        trend = indicators.get('price_trend', 'N/A')
        
        prompt = f"""You are a professional technical analyst. Summarize the following technical data into a strictly structured JSON brief.
        
STOCK: {symbol}
PRICE: ₹{quote.get('last_price', 'N/A')} ({quote.get('change_percent', 0):.2f}%)
TECH SCORE: {tech_score}/100 | TREND: {trend} | BIAS: {ms.get('bias', 'N/A')}
INDICATORS: { {k: v for k,v in indicators.items() if isinstance(v, (int, float, str)) and k != 'ohlc_data'} }

RULES:
1. FOCUS ONLY ON TECHNICALS (Price, Vol, Trend, Structures).
2. OUTPUT ONLY VALID JSON. NO MARKDOWN.
3. NO DISALLOWED LANGUAGE: 'buy', 'sell', 'predict', 'target', 'upside', 'downside', 'will', 'expected to', 'recommend'.
4. Schema:
{{
  "headline": "<1-line technical summary>",
  "primary_observation": "<The single most important technical alignment or misalignment>",
  "dominant_risk": "<The top technical risk identified (e.g., failed breakout, divergence)>",
  "monitoring_points": ["<Transition 1>", "<Transition 2>"],
  "confidence_note": "Non-predictive assessment based on price structure alignment"
}}

Note: Ensure EXACTLY 2 or 3 monitoring points.
"""
        return prompt

    def _build_fundamental_brief_prompt(
        self,
        symbol: str,
        quote: Dict[str, Any],
        fundamental_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a strict schema-based prompt for fundamental intelligence."""
        fund_regime = "NEUTRAL"
        fund_score = "N/A"
        f_details = "No fundamental data"
        if fundamental_data:
            fund_score_obj = fundamental_data.get("score", {})
            fund_regime = fund_score_obj.get("grade", "NEUTRAL")
            fund_score = fund_score_obj.get("value", "N/A")
            f_details = str(fundamental_data.get("financials", {}).get("cagr", {}))

        prompt = f"""You are a professional fundamental researcher. Summarize the following fundamental data into a strictly structured JSON brief.
        
STOCK: {symbol}
FUND GRADE: {fund_regime} | FUND SCORE: {fund_score}/100
KPIs: {f_details}

RULES:
1. FOCUS ONLY ON FUNDAMENTALS (Quality, Growth, Efficiency).
2. OUTPUT ONLY VALID JSON. NO MARKDOWN.
3. NO DISALLOWED LANGUAGE: 'buy', 'sell', 'predict', 'target', 'upside', 'downside', 'recommend'.
4. Schema:
{{
  "headline": "<1-line fundamental summary>",
  "primary_observation": "<The single most important fundamental insight>",
  "dominant_risk": "<The top business/financial risk constraint identifier (e.g., debt, efficiency decay)>",
  "monitoring_points": ["<Financial KPI 1>", "<Financial KPI 2>"],
  "confidence_note": "Non-predictive assessment based on current business metrics"
}}

Note: Ensure EXACTLY 2 or 3 monitoring points.
"""
        return prompt

    def _build_decision_brief_prompt(
        self,
        symbol: str,
        quote: Dict[str, Any],
        indicators: Dict[str, Any],
        fundamental_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a strict schema-based prompt for institutional decision briefs (Combined)."""
        ms = indicators.get('technical_score', {})
        tech_score = ms.get('score', 'N/A')
        trend = indicators.get('price_trend', 'N/A')
        
        fund_regime = "NEUTRAL"
        fund_score = "N/A"
        if fundamental_data:
            fund_score_obj = fundamental_data.get("score", {})
            fund_regime = fund_score_obj.get("grade", "NEUTRAL")
            fund_score = fund_score_obj.get("value", "N/A")

        prompt = f"""You are a professional institutional senior analyst. Summarize technical and fundamental confluence into a strictly structured JSON brief.
        
STOCK: {symbol}
TECH SCORE: {tech_score}/100 | TREND: {trend}
FUND GRADE: {fund_regime} | FUND SCORE: {fund_score}/100

RULES:
1. SYNTHESIZE BOTH SIDES.
2. OUTPUT ONLY VALID JSON. NO MARKDOWN.
3. NO DISALLOWED LANGUAGE: 'buy', 'sell', 'predict', 'target', 'upside', 'downside', 'recommend'.
4. Schema:
{{
  "headline": "<1-line institutional confluence summary>",
  "primary_observation": "<The single most important tech-fundamental alignment>",
  "dominant_risk": "<The top unified risk constraint>",
  "monitoring_points": ["<Transition 1>", "<Transition 2>"],
  "confidence_note": "Non-predictive assessment based on regime alignment"
}}

Note: Ensure EXACTLY 2 or 3 monitoring points.
"""
        return prompt
    
    async def _generate_with_openai(self, prompt: str, is_json: bool = False) -> str:
        """Generate analysis using OpenAI"""
        kwargs = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a professional stock market analyst. Provide clear, concise technical and fundamental analysis."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3 if is_json else 0.7,
            "max_tokens": 500
        }
        if is_json:
            kwargs["response_format"] = {"type": "json_object"}

        response = await self.openai_client.chat.completions.create(**kwargs)
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
        fundamental_data: Optional[Dict[str, Any]] = None,
        mode: str = "full"
    ) -> str:
        """Generate mock analysis for testing when LLM APIs are not available"""
        if mode == "decision_brief":
            return json.dumps({
                "headline": f"Institutional Confluence Brief for {symbol}",
                "primary_observation": "Price structure remains in technical alignment with business quality metrics.",
                "dominant_risk": "Regime volatility exceeds historical structural norms.",
                "monitoring_points": ["Price persistence above key moving averages", "Quarterly efficiency consistency"],
                "confidence_note": "Non-predictive assessment based on current regime alignment."
            })
        elif mode == "technical_brief":
            return json.dumps({
                "headline": f"Technical Intelligence: {symbol}",
                "primary_observation": f"Regime bias remains {indicators.get('price_trend', 'neutral')} with stable momentum.",
                "dominant_risk": "Mean reversion from overextended oscillators.",
                "monitoring_points": [f"Support at ₹{indicators.get('support_levels', [0])[0]}", "Resistance at key structural high"],
                "confidence_note": "Non-predictive technical assessment."
            })
        elif mode == "fundamental_brief":
            return json.dumps({
                "headline": f"Fundamental Health Brief: {symbol}",
                "primary_observation": "Capital efficiency remains above historical median.",
                "dominant_risk": "Potential margin compression from rising op-ex.",
                "monitoring_points": ["Upcoming quarterly earnings growth", "Debt-to-equity stability"],
                "confidence_note": "Non-predictive fundamental assessment."
            })

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

