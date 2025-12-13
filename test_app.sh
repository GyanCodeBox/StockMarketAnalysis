#!/bin/bash
# Quick test script for the Stock Analysis App

echo "🧪 Testing Agentic AI Stock Analysis App"
echo "========================================"
echo ""

# Check if backend is running
echo "1. Checking backend..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
else
    echo "   ❌ Backend is not running"
    echo "   Start it with: cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
    exit 1
fi

# Check if frontend is running
echo "2. Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 5173"
else
    echo "   ⚠️  Frontend may not be running"
    echo "   Start it with: cd frontend && npm run dev"
fi

# Test API endpoint
echo "3. Testing API endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol": "RELIANCE", "exchange": "NSE"}')

if echo "$RESPONSE" | grep -q "symbol"; then
    echo "   ✅ API endpoint is working"
    echo "   Response preview: $(echo $RESPONSE | cut -c1-100)..."
else
    echo "   ❌ API endpoint failed"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "✅ Basic tests complete!"
echo "Open http://localhost:5173 in your browser to test the UI"
