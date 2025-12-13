# Agentic AI Stock Analysis App (MVP)

An intelligent stock analysis application that uses LangGraph agents to fetch stock data, calculate technical indicators, and generate AI-powered analysis.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Agent**: LangGraph state machine orchestration
- **Stock Data**: Kite Connect API
- **LLM**: OpenAI/Claude for analysis generation

## Flow

1. User enters a symbol on React UI
2. Frontend sends POST /api/analyze
3. FastAPI validates → calls LangGraph agent
4. Agent fetches quote + OHLC from Kite
5. Agent calculates indicators (SMA, Support/Resistance, Volume)
6. Agent sends structured data to LLM for analysis
7. LLM generates plain-language technical commentary
8. Agent assembles final response → FastAPI → React UI

## Project Structure

```
StockMarketAnalysis/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes.py
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py
│   │   │   ├── nodes.py
│   │   │   └── state.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── kite_service.py
│   │       ├── technical_tool.py
│   │       └── llm_service.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── StockInput.jsx
│   │   │   ├── StockChart.jsx
│   │   │   ├── StockInfo.jsx
│   │   │   └── AIAnalysisDisplay.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

5. Run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the frontend:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the `backend` directory with:

```
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
KITE_ACCESS_TOKEN=your_kite_access_token
OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Usage

1. Start the backend server (port 8000)
2. Start the frontend dev server (usually port 5173)
3. Open the frontend URL in your browser
4. Enter a stock symbol (e.g., "RELIANCE", "TCS") and click Analyze
5. View the AI-generated stock analysis

## API Endpoints

- `POST /api/analyze` - Analyze a stock symbol
  - Request body: `{"symbol": "RELIANCE"}`
  - Response: Stock data, indicators, and AI analysis


