import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

@pytest.fixture
def mock_ohlc_data():
    """Generates 100 days of flat OHLC data"""
    base_date = datetime.now() - timedelta(days=100)
    data = []
    for i in range(100):
        date = base_date + timedelta(days=i)
        data.append({
            "time": date.strftime("%Y-%m-%d"),
            "open": 100.0,
            "high": 105.0,
            "low": 95.0,
            "close": 100.0,
            "volume": 10000
        })
    return {"data": data}

@pytest.fixture
def mock_financial_df():
    """Generates 12 quarters of improving financial data"""
    data = []
    base_date = datetime(2022, 1, 1)
    for i in range(12):
        date = base_date + timedelta(days=91 * i)
        q = (i % 4) + 1
        year = 2022 + (i // 4)
        
        # Growing revenue and EPS
        revenue = 1000 * (1.1 ** i)
        eps = 10 * (1.05 ** i)
        
        data.append({
            "date": date,
            "revenue": revenue,
            "eps": eps,
            "netIncome": revenue * 0.15,
            "otherIncome": revenue * 0.02,
            "operatingIncome": revenue * 0.2,
            "totalAssets": 5000 + (100 * i),
            "totalCurrentLiabilities": 1000,
            "period": f"Q{q}",
            "calendarYear": str(year)
        })
    return pd.DataFrame(data)
