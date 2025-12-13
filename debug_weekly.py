
import sys
import json
from dotenv import load_dotenv

sys.path.append("./backend")
load_dotenv("./backend/.env")

from app.services.kite_service import KiteService

def debug_weekly():
    print("Debugging Weekly Timeframe...")
    service = KiteService()
    
    # Fetch weekly data
    try:
        # We need to test the internal logic, so we call get_ohlc directly
        result = service.get_ohlc("RELIANCE", "NSE", days=1095, interval="week")
        
        data = result.get("data", [])
        print(f"Data points returned: {len(data)}")
        
        if not data:
            print("❌ No data returned")
            return

        print("\nFirst 3 data points:")
        print(json.dumps(data[:3], indent=2))
        
        print("\nLast 3 data points:")
        print(json.dumps(data[-3:], indent=2))
        
        # Check specific fields
        sample = data[0]
        required_fields = ["date", "open", "high", "low", "close", "volume"]
        missing = [f for f in required_fields if f not in sample]
        
        if missing:
             print(f"❌ Missing fields: {missing}")
        else:
             print("✅ All required fields present")
             
        # Check if dates are weekly spaced (approx 7 days)
        if len(data) > 1:
            from datetime import datetime
            d1 = datetime.fromisoformat(data[0]["date"])
            d2 = datetime.fromisoformat(data[1]["date"])
            diff = (d2 - d1).days
            print(f"\nDate difference between first two points: {diff} days")
            if diff < 5:
                print("⚠️ Warning: Dates are closer than 5 days. Resampling might be failing or falling back to daily.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_weekly()
