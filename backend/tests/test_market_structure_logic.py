"""
Tests for MarketStructureService (Decision Matrix Logic)
"""
import unittest
import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend'))

from app.services.market_structure_service import MarketStructureService

class TestMarketStructureService(unittest.TestCase):
    def setUp(self):
        self.service = MarketStructureService()

    def _generate_candles(self, start_price=100.0, trend="flat", length=50, volatility=0.5):
        candles = []
        price = start_price
        base_time = datetime.now() - timedelta(days=length)
        
        for i in range(length):
            if trend == "flat":
                change = (i % 2 - 0.5) * volatility
            elif trend == "up":
                change = 0.5 + (i % 2 - 0.5) * volatility
            elif trend == "down":
                 change = -0.5 + (i % 2 - 0.5) * volatility
            
            price += change
            
            high = price + volatility
            low = price - volatility
            
            candles.append({
                "open": price, 
                "high": high,
                "low": low,
                "close": price,
                "volume": 1000 + (i * 10),
                "time": (base_time + timedelta(days=i)).isoformat()
            })
            
        return candles

    def test_neutral_structure(self):
        # Create random noisy data
        candles = self._generate_candles(length=60, volatility=5.0) # High volatility
        ohlc_data = {"data": candles}
        
        structure = self.service.evaluate_structure(ohlc_data)
        
        print(f"\nNeutral Test Result: {structure.bias} ({structure.explanation})")
        
        self.assertEqual(structure.bias, "NEUTRAL")
        self.assertEqual(structure.confidence, "High")

    def test_accumulation_priority(self):
        # We need to mock the internal services or construct very specific data
        # For this integration test, we'll trust the underlying services detect something 
        # if we feed them detecting patterns, but easier to mock the calls to verify LOGIC.
        
        # Mocking FailedBreakoutService to return NOTHING
        self.service.failed_breakout_service.detect_failed_breakouts = lambda x, y: []
        
        # Mocking AccumulationZoneService to return A ZONE
        fake_zone = {
            "summary": "Test Zone",
            "confidence": "Medium",
            "start_time": "2023-01-01",
            "end_time": "2023-01-10",
        }
        self.service.accumulation_service.detect_zones = lambda x, trend_context: [fake_zone]
        
        structure = self.service.evaluate_structure({"data": []})
        
        print(f"\nAccumulation Test Result: {structure.bias}")
        self.assertEqual(structure.bias, "ACCUMULATION")
        self.assertEqual(structure.explanation, "Constructive action. Test Zone Price is compressing with signs of absorption, indicating potential for upward expansion.")

    def test_failed_breakout_override(self):
        # Rule 1: Failed Breakout > Accumulation
        
        # Mock FailedBreakoutService to return A FAILURE
        fake_failure = {
            "summary": "Trap detected",
            "confidence": "High",
            "direction": "up"
        }
        self.service.failed_breakout_service.detect_failed_breakouts = lambda x, y: [fake_failure]
        
        # Mock AccumulationZoneService to ALSO return a zone (conflict)
        fake_zone = {
            "summary": "Test Zone",
            "confidence": "Medium"
        }
        self.service.accumulation_service.detect_zones = lambda x, trend_context: [fake_zone]
        
        structure = self.service.evaluate_structure({"data": []})
        
        print(f"\nOverride Test Result: {structure.bias}")
        
        self.assertEqual(structure.bias, "FAILED_BREAKOUT")
        self.assertIn("Trap", structure.explanation)

if __name__ == '__main__':
    unittest.main()
