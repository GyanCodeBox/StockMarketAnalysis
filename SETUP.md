# Setup Guide

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env and add your API keys

# Run the backend server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Run the frontend dev server
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

Create a `.env` file in the `backend` directory with the following:

```env
# Kite Connect API Credentials (for real stock data)
KITE_API_KEY=your_kite_api_key
KITE_API_SECRET=your_kite_api_secret
KITE_ACCESS_TOKEN=your_kite_access_token

# LLM Provider (at least one required for AI analysis)
OPENAI_API_KEY=your_openai_api_key
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key

# Logging
LOG_LEVEL=INFO
```

**Note:** If you don't have API keys, the app will use mock data for testing purposes.

## Testing Without API Keys

The application is designed to work with mock data if API keys are not provided:
- Stock data will be randomly generated
- AI analysis will use a template-based mock response

This allows you to test the application flow without setting up API accounts initially.

## Troubleshooting

### Backend Issues

1. **Import errors**: Make sure you're in the backend directory and virtual environment is activated
2. **Port already in use**: Change the port in the uvicorn command: `--port 8001`
3. **Module not found**: Run `pip install -r requirements.txt` again

### Frontend Issues

1. **Cannot connect to backend**: Check that backend is running on port 8000
2. **Build errors**: Delete `node_modules` and run `npm install` again
3. **Port conflicts**: Vite will automatically use the next available port

## Production Deployment

For production deployment:

1. Build the frontend: `cd frontend && npm run build`
2. Serve the frontend build with a static file server or integrate with backend
3. Set proper CORS origins in `backend/app/main.py`
4. Use environment variables for all sensitive data
5. Consider using a process manager like PM2 or systemd for the backend


