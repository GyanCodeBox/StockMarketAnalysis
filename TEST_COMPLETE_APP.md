# Complete Application Testing Guide

This guide walks you through testing the entire Agentic AI Stock Analysis application end-to-end.

## Prerequisites Check

Before starting, verify you have:

```bash
# Check Python version (3.9+)
python3 --version

# Check Node.js version (18+)
node --version

# Check npm
npm --version
```

## Step 1: Backend Setup & Start

### Terminal 1 - Backend

```bash
# Navigate to backend
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Verify dependencies are installed
pip list | grep fastapi

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Backend is running at:** http://localhost:8000
✅ **API Docs at:** http://localhost:8000/docs

### Verify Backend Health

Open a new terminal (keep backend running) and test:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected: {"status":"healthy"}

# Test root endpoint
curl http://localhost:8000/

# Expected: {"message":"Agentic AI Stock Analysis API","status":"running"}
```

## Step 2: Frontend Setup & Start

### Terminal 2 - Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start the frontend dev server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

✅ **Frontend is running at:** http://localhost:5173

## Step 3: Test the Application Flow

### 3.1 Open the Application

1. Open your browser
2. Navigate to: **http://localhost:5173**
3. You should see the "Agentic AI Stock Analysis" interface

### 3.2 Test with Mock Data (No API Keys Required)

**This works immediately without any API keys!**

1. **Enter a stock symbol:**
   - Type: `RELIANCE` (or any symbol like `TCS`, `INFY`, `HDFCBANK`)
   - Select exchange: `NSE` (default)

2. **Click "Analyze" button**

3. **Expected Results:**
   - Loading spinner appears
   - After a few seconds, you should see:
     - **Stock Info Card**: Current price, change, OHLC data
     - **Technical Indicators Card**: SMA, Support/Resistance, Volume analysis
     - **AI Analysis Card**: Generated technical commentary

4. **Check Backend Terminal:**
   - You should see logs like:
     ```
     Initializing analysis for RELIANCE on NSE
     Fetching stock data for RELIANCE on NSE
     Successfully fetched data for RELIANCE
     Calculating indicators for RELIANCE
     Successfully calculated indicators for RELIANCE
     Generating AI analysis for RELIANCE
     Successfully generated analysis for RELIANCE
     Analysis completed for RELIANCE with status: completed
     ```

### 3.3 Test API Directly (Optional)

Open http://localhost:8000/docs in your browser:

1. **Find `POST /api/analyze`**
2. Click "Try it out"
3. Enter request body:
   ```json
   {
     "symbol": "TCS",
     "exchange": "NSE"
   }
   ```
4. Click "Execute"
5. View the response with all data

## Step 4: Test with Real API Keys (Optional)

### 4.1 Add API Keys to `.env`

Edit `backend/.env`:

```env
# For real stock data
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_secret
KITE_ACCESS_TOKEN=your_access_token

# For AI analysis (choose one)
OPENAI_API_KEY=sk-your_openai_key
# OR
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

### 4.2 Restart Backend

In Terminal 1 (backend):
- Press `Ctrl+C` to stop
- Start again: `uvicorn app.main:app --reload --port 8000`

### 4.3 Test Again

1. Go to http://localhost:5173
2. Enter a real stock symbol (e.g., `RELIANCE`)
3. Click "Analyze"
4. You should now see **real data** instead of mock data

**Check Backend Logs:**
- Should see: `Kite Connect initialized successfully`
- Should see: `OpenAI client initialized` or `Anthropic client initialized`

## Step 5: Test Different Scenarios

### 5.1 Test Different Stock Symbols

Try various symbols:
- `RELIANCE` - Large cap
- `TCS` - IT sector
- `INFY` - IT sector
- `HDFCBANK` - Banking
- `SBIN` - Banking

### 5.2 Test Different Exchanges

- `NSE` (National Stock Exchange)
- `BSE` (Bombay Stock Exchange)

### 5.3 Test Error Handling

1. **Invalid Symbol:**
   - Enter: `INVALID123`
   - Should show error message

2. **Empty Symbol:**
   - Leave symbol field empty
   - Button should be disabled

3. **Network Error:**
   - Stop backend server
   - Try to analyze
   - Should show connection error

## Step 6: Verify All Components

### 6.1 Frontend Components

Check that all UI components render:

- ✅ **StockInput**: Symbol input and exchange dropdown
- ✅ **StockInfo**: Price, change, OHLC display
- ✅ **StockChart**: Technical indicators visualization
- ✅ **AIAnalysisDisplay**: Formatted AI analysis

### 6.2 Backend Endpoints

Test all endpoints:

```bash
# Health check
curl http://localhost:8000/health

# Root endpoint
curl http://localhost:8000/

# Analyze endpoint
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "RELIANCE", "exchange": "NSE"}'

# Kite auth endpoints (if API keys set)
curl http://localhost:8000/api/kite/login-url
curl http://localhost:8000/api/kite/validate-token
```

### 6.3 Agent Flow

Verify the LangGraph agent executes all nodes:

1. **INIT** - Initialization
2. **FETCH_STOCK_DATA** - Data fetching
3. **CALC_INDICATORS** - Indicator calculation
4. **GENERATE_ANALYSIS** - AI analysis
5. **FORMAT_RESPONSE** - Response formatting

Check backend logs to see each step.

## Step 7: Performance Testing

### 7.1 Response Time

- First request: May take 5-10 seconds (cold start)
- Subsequent requests: Should be faster (2-5 seconds)

### 7.2 Concurrent Requests

Test multiple requests:
```bash
# Run multiple requests in parallel
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"symbol": "RELIANCE", "exchange": "NSE"}' &
done
wait
```

## Step 8: Browser Console Check

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Test the application
4. Check for any JavaScript errors
5. Check **Network** tab for API calls

## Step 9: Full Integration Test

### Complete User Journey

1. ✅ Open http://localhost:5173
2. ✅ Enter symbol: `RELIANCE`
3. ✅ Select exchange: `NSE`
4. ✅ Click "Analyze"
5. ✅ See loading state
6. ✅ View stock info
7. ✅ View technical indicators
8. ✅ Read AI analysis
9. ✅ Try another symbol
10. ✅ Verify data updates

## Troubleshooting

### Backend Won't Start

```bash
# Check if port is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Can't Connect

1. Check backend is running on port 8000
2. Check browser console for errors
3. Verify CORS settings in `backend/app/main.py`
4. Check `frontend/vite.config.js` proxy settings

### Import Errors

```bash
# Reinstall dependencies
cd backend
source venv/bin/activate
pip install -r requirements.txt

# For frontend
cd frontend
rm -rf node_modules
npm install
```

### No Data Showing

1. Check backend logs for errors
2. Verify API keys are correct (if using real APIs)
3. Check browser Network tab for failed requests
4. Verify `.env` file is in `backend/` directory

### Mock Data Issues

- Mock data is randomly generated
- Each request may show different values
- This is expected behavior for testing

## Success Criteria

Your application is working correctly if:

- ✅ Backend starts without errors
- ✅ Frontend starts without errors
- ✅ UI loads and displays correctly
- ✅ Can enter symbol and click Analyze
- ✅ Receives response with data
- ✅ All components render properly
- ✅ No console errors
- ✅ Backend logs show agent flow
- ✅ API endpoints respond correctly

## Next Steps After Testing

Once everything works:

1. ✅ Test with real API keys
2. ✅ Test with different stock symbols
3. ✅ Verify AI analysis quality
4. ✅ Check technical indicators accuracy
5. ✅ Test error scenarios
6. ✅ Review performance

## Quick Test Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can enter stock symbol
- [ ] Can click Analyze button
- [ ] See loading state
- [ ] Receive response with data
- [ ] Stock info displays
- [ ] Technical indicators show
- [ ] AI analysis displays
- [ ] No console errors
- [ ] Backend logs show flow

## Summary

**Quick Test Command Sequence:**

```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend  
cd frontend && npm run dev

# Browser
# Open http://localhost:5173
# Enter "RELIANCE" and click Analyze
```

That's it! Your application should be fully functional. 🚀

