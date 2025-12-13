# Testing Guide - Next Steps

## Step 1: Add API Keys

I've created a `.env` file in the `backend` directory. Now you need to add your API keys:

### Option A: Using Kite Connect + LLM (Full Functionality)

1. **Kite Connect API** (for real stock data):
   - Sign up at https://kite.trade/
   - Get your API Key, API Secret, and Access Token
   - Add them to `backend/.env`:
   ```env
   KITE_API_KEY=your_actual_kite_api_key
   KITE_API_SECRET=your_actual_kite_api_secret
   KITE_ACCESS_TOKEN=your_actual_kite_access_token
   ```

2. **LLM Provider** (for AI analysis - choose one):
   
   **OpenAI:**
   - Get API key from https://platform.openai.com/api-keys
   - Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your_openai_api_key_here
   ```
   
   **OR Anthropic Claude:**
   - Get API key from https://console.anthropic.com/
   - Add to `backend/.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
   ```

### Option B: Testing Without API Keys (Mock Data)

The application works without API keys using mock data! You can test immediately:
- Stock data will be randomly generated
- AI analysis will use a template-based response

Just leave the `.env` file as-is or comment out the API key lines.

## Step 2: Start the Backend Server

Open Terminal 1:

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Start the server
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

✅ Backend is running at: http://localhost:8000
✅ API docs available at: http://localhost:8000/docs

## Step 3: Start the Frontend Server

Open Terminal 2 (new terminal window):

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ Frontend is running at: http://localhost:5173

## Step 4: Test the Application

1. **Open your browser** and go to: http://localhost:5173

2. **Enter a stock symbol**:
   - For Indian stocks: `RELIANCE`, `TCS`, `INFY`, `HDFCBANK`
   - Select exchange: `NSE` or `BSE`

3. **Click "Analyze"** button

4. **View the results**:
   - Stock Info: Current price, change, OHLC data
   - Technical Indicators: SMA, Support/Resistance levels, Volume analysis
   - AI Analysis: AI-generated technical commentary

## Step 5: Verify API Connection

### Test Backend API Directly

Visit http://localhost:8000/docs to use the interactive API documentation:

1. Click on `POST /api/analyze`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "symbol": "RELIANCE",
     "exchange": "NSE"
   }
   ```
4. Click "Execute"
5. Check the response

### Check Logs

Watch the backend terminal for:
- ✅ `Successfully fetched data for RELIANCE` (if using real API)
- ✅ `Successfully calculated indicators`
- ✅ `Successfully generated analysis`

Or if using mock data:
- ⚠️ `Kite Connect credentials not found. Using mock data.`
- ⚠️ `No LLM API keys found. Using mock analysis.`

## Troubleshooting

### Backend won't start
- Make sure virtual environment is activated: `source venv/bin/activate`
- Check if port 8000 is available: `lsof -i :8000`
- Try a different port: `--port 8001`

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check browser console for CORS errors
- Ensure `vite.config.js` has correct proxy settings

### Import errors in IDE
- Reload IDE window (Cmd+Shift+P → "Reload Window")
- Verify `.vscode/settings.json` points to `backend/venv/bin/python`

### API errors
- Check `.env` file has correct API keys (no quotes needed)
- Verify API keys are valid and have proper permissions
- Check backend logs for specific error messages

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:8000/health

# Test analyze endpoint
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "RELIANCE", "exchange": "NSE"}'
```

## Next Steps After Testing

Once everything works:
1. ✅ Test with different stock symbols
2. ✅ Try different exchanges (NSE/BSE)
3. ✅ Compare mock vs real API responses
4. ✅ Check the AI analysis quality
5. ✅ Review technical indicators accuracy

Happy testing! 🚀

