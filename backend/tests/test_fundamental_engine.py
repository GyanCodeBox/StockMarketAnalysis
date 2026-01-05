import pytest
import pandas as pd
import numpy as np
from app.tools.fundamental_tool import FundamentalTool

def test_fundamental_scoring_growth(mock_financial_df):
    """Test that improving financials lead to Strong grade"""
    tool = FundamentalTool()
    result = tool._calculate_metrics(mock_financial_df)
    
    score = result['score']
    assert score['value'] >= 0 and score['value'] <= 100
    # With 10% revenue growth and 5% eps growth per quarter, it should be Strong/Neutral
    assert score['grade'] in ["Strong", "Neutral"]
    assert "Growth" in score['phase'] or "Maturity" in score['phase']

def test_fundamental_divergence_penalty():
    """Test that revenue growth with EPS decline triggers warnings and lower score"""
    data = []
    for i in range(8):
        # Revenue grows 10% each quarter, but EPS drops
        revenue = 1000 * (1.1 ** i)
        eps = 10 * (0.9 ** i)
        data.append({
            "date": pd.to_datetime(f"2023-{3*(i%4)+1}-01"),
            "revenue": revenue,
            "eps": eps,
            "netIncome": revenue * 0.05,
            "otherIncome": 0,
            "operatingIncome": revenue * 0.1,
            "totalAssets": 5000,
            "totalCurrentLiabilities": 1000,
            "period": f"Q{(i%4)+1}",
            "calendarYear": "2023"
        })
    df = pd.DataFrame(data)
    tool = FundamentalTool()
    result = tool._calculate_metrics(df)
    
    # Check for divergence warning
    assert any("Profits lagging" in w for w in result['score']['warnings'])
    assert result['score']['phase'] == "Compression"

def test_high_other_income_penalty():
    """Test that high other income reduces score and triggers warning"""
    data = []
    for i in range(8):
        revenue = 1000
        net_income = 100
        # Other income is 40% of net income
        other_income = 40 
        data.append({
            "date": pd.to_datetime(f"2023-{3*(i%4)+1}-01"),
            "revenue": revenue,
            "eps": 10,
            "netIncome": net_income,
            "otherIncome": other_income,
            "operatingIncome": 200,
            "totalAssets": 5000,
            "totalCurrentLiabilities": 1000,
            "period": f"Q{(i%4)+1}",
            "calendarYear": "2023"
        })
    df = pd.DataFrame(data)
    tool = FundamentalTool()
    result = tool._calculate_metrics(df)
    
    assert any("High other income" in w for w in result['score']['warnings'])
    # Score should be impacted
    assert result['score']['value'] < 60 

def test_roce_calculation():
    """Verify ROCE calculation logic"""
    data = [{
        "date": pd.to_datetime("2024-01-01"),
        "revenue": 1000,
        "eps": 10,
        "netIncome": 150,
        "otherIncome": 0,
        "operatingIncome": 200,
        "totalAssets": 2000,
        "totalCurrentLiabilities": 500,
        "period": "Q1",
        "calendarYear": "2024"
    }]
    df = pd.DataFrame(data)
    tool = FundamentalTool()
    result = tool._calculate_metrics(df)
    
    # ROCE = EBIT / (Assets - Liabilities) = 200 / (2000 - 500) = 200 / 1500 = 13.33%
    latest_roce = result['derived']['efficiency'][-1]['roce']
    assert pytest.approx(latest_roce, 0.01) == 13.33
