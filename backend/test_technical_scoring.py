
import sys
import os
import unittest
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.technical_scoring import TechnicalScorer

class TestTechnicalScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = TechnicalScorer()
        
    def create_mock_ohlc(self, days=30, trend="bullish", current_price=100):
        data = []
        price = current_price
        
        # Backwards generation
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            
            if trend == "bullish":
                # Price was lower in past
                open_p = price * (1 - 0.01)
                close_p = price
                high_p = price * 1.01
                low_p = price * 0.98
                price = price * 0.99 # Decrease as we go back
            else:
                # Price was higher in past (downtrend)
                open_p = price * 1.01
                close_p = price
                high_p = price * 1.02
                low_p = price * 0.99
                price = price * 1.01 # Increase as we go back
                
            data.append({
                "date": date.isoformat(),
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": 1000000
            })
            
        return list(reversed(data))

    def test_bullish_scenario(self):
        """Test a strong bullish case"""
        current_price = 2500
        ohlc = self.create_mock_ohlc(days=20, trend="bullish", current_price=current_price)
        
        # Perfect MA setup
        ma_data = {
            "SMA_50": 2400,
            "SMA_200": 2300
        }
        
        # Add volume spike to last candle
        ohlc[-1]['volume'] = 2000000 # 2x average
        
        score = self.scorer.calculate_score(current_price, ma_data, ohlc, "Daily")
        
        print(f"\nBullish Score: {score['total_score']}")
        print(f"Components: {score['components']}")
        
        self.assertGreater(score['total_score'], 80)
        self.assertEqual(score['grade'], "Strong Bullish")
        
    def test_bearish_scenario(self):
        """Test a bearish case"""
        current_price = 500
        ohlc = self.create_mock_ohlc(days=20, trend="bearish", current_price=current_price)
        
        # Bearish MA setup
        ma_data = {
            "SMA_50": 550,
            "SMA_200": 600
        }
        
        score = self.scorer.calculate_score(current_price, ma_data, ohlc, "Daily")
        
        print(f"\nBearish Score: {score['total_score']}")
        print(f"Components: {score['components']}")
        
        self.assertLess(score['total_score'], 40)
        
    def test_missing_ma_scenario(self):
        """Test missing MA keys scenario"""
        current_price = 100
        ohlc = self.create_mock_ohlc(days=20, trend="neutral", current_price=current_price)
        
        # Incomplete MA data (e.g. user only requested SMA 10)
        ma_data = {
            "SMA_10": 105
        }
        
        score = self.scorer.calculate_score(current_price, ma_data, ohlc, "Daily")
        
        print(f"\nMissing MA Score: {score['total_score']}")
        print(f"Signals: {score['signals']}")
        
        # Should behave gracefully (neutral score 0 for MA component)
        # But should NOT return error signal
        self.assertNotIn("⚠️ Error calculating detailed score", score['signals'])

if __name__ == '__main__':
    unittest.main()
