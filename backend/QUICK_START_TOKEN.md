# Quick Start: Generate Kite Access Token

## Fastest Method (Recommended)

### 1. Add API Key and Secret to `.env`

```bash
cd backend
# Edit .env file and add:
KITE_API_KEY=your_api_key
KITE_API_SECRET=your_api_secret
```

### 2. Run the Script

```bash
source venv/bin/activate
python scripts/generate_kite_token.py
```

### 3. Follow the Prompts

- Script opens browser → Login to Kite
- Copy redirect URL from browser
- Paste into script
- Script updates `.env` automatically

**Done!** Your access token is now in `.env`

---

## Alternative: Use API Endpoints

### 1. Start Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. Get Login URL

```bash
curl http://localhost:8000/api/kite/login-url
```

### 3. Open URL in Browser & Login

### 4. Generate Token

```bash
curl -X POST http://localhost:8000/api/kite/generate-token \
  -H "Content-Type: application/json" \
  -d '{"redirect_url": "PASTE_REDIRECT_URL_HERE"}'
```

### 5. Add Token to `.env`

```env
KITE_ACCESS_TOKEN=token_from_response
```

---

## Verify Token Works

```bash
curl http://localhost:8000/api/kite/validate-token
```

For detailed instructions, see `KITE_TOKEN_GUIDE.md`

