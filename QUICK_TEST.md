# 🚀 Quick Test Guide - 3 Steps

## Step 1: Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

✅ Wait for: `Application startup complete.`

---

## Step 2: Start Frontend (Terminal 2)

```bash
cd frontend
npm install  # First time only
npm run dev
```

✅ Wait for: `Local: http://localhost:5173/`

---

## Step 3: Test in Browser

1. Open: **http://localhost:5173**
2. Enter symbol: `RELIANCE`
3. Click: **"Analyze"**
4. Wait 3-5 seconds
5. See results! 🎉

---

## What You Should See

✅ **Stock Info**: Price, change, OHLC  
✅ **Technical Indicators**: SMA, Support/Resistance  
✅ **AI Analysis**: Generated commentary  

---

## Quick Verification

```bash
# Test backend health
curl http://localhost:8000/health

# Test API
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "RELIANCE", "exchange": "NSE"}'
```

---

## Troubleshooting

**Backend not starting?**
- Check port 8000 is free: `lsof -i :8000`
- Activate venv: `source venv/bin/activate`

**Frontend not starting?**
- Install deps: `npm install`
- Check port 5173 is free

**No data showing?**
- Check backend terminal for errors
- Check browser console (F12)
- Works with mock data - no API keys needed!

---

**For detailed testing, see `TEST_COMPLETE_APP.md`**

