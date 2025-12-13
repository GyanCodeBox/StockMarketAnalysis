# Technical Indicators Calculation Explained

## Overview

This document explains how technical indicators are calculated in the Stock Analysis application.

## 1. Simple Moving Average (SMA)

### Calculation Method

**20-day SMA** = Average of the last 20 closing prices

```
SMA_20 = (Price_Day_1 + Price_Day_2 + ... + Price_Day_20) / 20
```

### Implementation

- Takes the **last 20 closing prices** from the historical data
- Calculates the arithmetic mean
- Data is sorted chronologically (oldest to newest) before calculation
- If less than 20 days of data available, uses average of available prices

### Example

If closing prices for last 20 days are:
```
[100, 102, 101, 103, 105, 104, 106, 107, 105, 108, 
 110, 109, 111, 112, 110, 113, 115, 114, 116, 118]
```

20-day SMA = (100 + 102 + ... + 118) / 20 = **109.5**

### Why This Matters

- **Above SMA**: Stock is in uptrend (bullish)
- **Below SMA**: Stock is in downtrend (bearish)
- **Price crossing SMA**: Potential trend reversal signal

---

## 2. Support Levels

### What is Support?

Support is a price level where:
- Price has **bounced up** multiple times
- Buyers are willing to buy (demand zone)
- Price is likely to find support if it falls to this level

### Calculation Method (Pivot Point Method)

1. **Find Local Minima (Pivot Lows)**
   - Scan through price data
   - Identify points where the low is lower than surrounding periods
   - These are "pivot lows" - price levels that were tested and held

2. **Select Significant Levels**
   - Take the most significant pivot lows
   - Prioritize recent levels
   - Return the 3 most important support levels

### Example

If price lows show these pivot points:
```
Day 1: Low = 100
Day 5: Low = 98  ← Pivot low (lower than neighbors)
Day 10: Low = 99
Day 15: Low = 97 ← Pivot low (lower than neighbors)
Day 20: Low = 99
```

Support levels might be: **[97, 98, 99]**

### Why This Matters

- **Price near support**: Likely to bounce up
- **Price breaks support**: May continue falling (bearish signal)
- **Multiple touches**: Stronger support level

---

## 3. Resistance Levels

### What is Resistance?

Resistance is a price level where:
- Price has **bounced down** multiple times
- Sellers are willing to sell (supply zone)
- Price is likely to face resistance if it rises to this level

### Calculation Method (Pivot Point Method)

1. **Find Local Maxima (Pivot Highs)**
   - Scan through price data
   - Identify points where the high is higher than surrounding periods
   - These are "pivot highs" - price levels that were tested and rejected

2. **Select Significant Levels**
   - Take the most significant pivot highs
   - Prioritize recent levels
   - Return the 3 most important resistance levels

### Example

If price highs show these pivot points:
```
Day 1: High = 110
Day 5: High = 112 ← Pivot high (higher than neighbors)
Day 10: High = 111
Day 15: High = 115 ← Pivot high (higher than neighbors)
Day 20: High = 113
```

Resistance levels might be: **[115, 112, 113]**

### Why This Matters

- **Price near resistance**: Likely to bounce down
- **Price breaks resistance**: May continue rising (bullish signal)
- **Multiple touches**: Stronger resistance level

---

## Previous Implementation Issues (FIXED)

### ❌ Old Method (Incorrect)

**Support**: Just took the 3 lowest values from all lows
- Problem: These might be old, irrelevant levels
- Problem: Doesn't identify actual support zones

**Resistance**: Just took the 3 highest values from all highs
- Problem: These might be old, irrelevant levels
- Problem: Doesn't identify actual resistance zones

### ✅ New Method (Correct)

**Support**: Uses pivot point method to find local minima
- Identifies actual price levels where price bounced up
- More accurate representation of support zones

**Resistance**: Uses pivot point method to find local maxima
- Identifies actual price levels where price bounced down
- More accurate representation of resistance zones

---

## Data Requirements

### For Accurate Calculations

- **Minimum 20 days** of data for 20-day SMA
- **Minimum 50 days** of data for 50-day SMA
- **Minimum 200 days** of data for 200-day SMA
- **Minimum 5-10 days** for meaningful support/resistance levels

### Data Quality

- Data must be **chronologically sorted** (oldest to newest)
- No gaps in trading days (weekends/holidays excluded)
- Accurate OHLC (Open, High, Low, Close) values

---

## Testing the Calculations

You can verify the calculations by:

1. **Check SMA manually:**
   ```python
   # Get last 20 closing prices
   closes = [100, 102, 101, ...]  # Last 20 values
   sma_20 = sum(closes) / len(closes)
   ```

2. **Check Support/Resistance:**
   - Look at price chart
   - Identify where price bounced up (support)
   - Identify where price bounced down (resistance)
   - Compare with calculated levels

---

## Future Improvements

Potential enhancements:

1. **Volume-weighted support/resistance**: Consider volume at pivot points
2. **Fibonacci levels**: Add Fibonacci retracement levels
3. **Dynamic support/resistance**: Adjust based on volatility
4. **Multiple timeframe analysis**: Support/resistance across different timeframes
5. **Confidence scores**: Rate support/resistance strength

---

## References

- [Moving Averages Explained](https://www.investopedia.com/terms/m/movingaverage.asp)
- [Support and Resistance](https://www.investopedia.com/trading/support-and-resistance-basics/)
- [Pivot Points](https://www.investopedia.com/terms/p/pivotpoint.asp)

