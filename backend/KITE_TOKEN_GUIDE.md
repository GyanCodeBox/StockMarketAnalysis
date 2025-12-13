# Kite Connect Access Token Generation Guide

This guide explains how to automatically generate a Kite Connect access token.

## Why Generate Access Token Automatically?

Kite Connect uses OAuth for authentication. The access token is obtained through a login flow:
1. Get login URL
2. User logs in via browser
3. Extract request token from redirect
4. Exchange request token for access token

## Method 1: Using the Python Script (Recommended)

### Step 1: Set up API Key and Secret

Edit `backend/.env` and add:
```env
KITE_API_KEY=your_api_key_here
KITE_API_SECRET=your_api_secret_here
```

### Step 2: Run the Script

```bash
cd backend
source venv/bin/activate
python scripts/generate_kite_token.py
```

### Step 3: Follow the Instructions

1. The script will open a browser with the login URL
2. Log in to your Kite account
3. After login, you'll be redirected to a URL
4. Copy the entire redirect URL from your browser
5. Paste it into the script
6. The script will generate the access token and optionally update your `.env` file

**Example redirect URL format:**
```
https://your-redirect-url.com/?request_token=abc123xyz&action=login&status=success
```

## Method 2: Using the API Endpoints

### Step 1: Get Login URL

```bash
curl http://localhost:8000/api/kite/login-url
```

Response:
```json
{
  "login_url": "https://kite.trade/connect/login?api_key=...",
  "instructions": "..."
}
```

### Step 2: Open Login URL

Open the `login_url` in your browser and log in to Kite.

### Step 3: Generate Access Token

After login, copy the redirect URL and send it to the API:

```bash
curl -X POST http://localhost:8000/api/kite/generate-token \
  -H "Content-Type: application/json" \
  -d '{"redirect_url": "https://your-redirect-url.com/?request_token=abc123..."}'
```

Response:
```json
{
  "access_token": "your_access_token_here",
  "user_id": "AB1234",
  "user_name": "John Doe",
  "email": "john@example.com",
  "broker": "ZERODHA"
}
```

### Step 4: Update .env File

Add the access token to `backend/.env`:
```env
KITE_ACCESS_TOKEN=your_access_token_here
```

## Method 3: Using Interactive API Docs

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```

2. Open http://localhost:8000/docs

3. Use the `/api/kite/login-url` endpoint to get the login URL

4. Log in via browser

5. Use the `/api/kite/generate-token` endpoint with the redirect URL

## Method 4: Manual Process

If you prefer to do it manually:

1. **Get Login URL:**
   ```python
   from kiteconnect import KiteConnect
   kite = KiteConnect(api_key="your_api_key")
   login_url = kite.login_url()
   print(login_url)
   ```

2. **Open the URL** in browser and log in

3. **Extract request_token** from the redirect URL

4. **Generate access token:**
   ```python
   data = kite.generate_session(
       request_token="request_token_from_url",
       api_secret="your_api_secret"
   )
   access_token = data['access_token']
   print(f"Access Token: {access_token}")
   ```

## Validate Your Token

Check if your access token is still valid:

```bash
curl http://localhost:8000/api/kite/validate-token
```

Or use the interactive docs at http://localhost:8000/docs

## Important Notes

1. **Request tokens expire quickly** - Use them immediately after getting them
2. **Access tokens are long-lived** - They typically last until you revoke them
3. **Keep API secret secure** - Never commit it to version control
4. **Token refresh** - If token expires, regenerate using the same process

## Troubleshooting

### "Request token expired"
- Request tokens expire within minutes
- Generate a new login URL and try again

### "Invalid request token"
- Make sure you copied the complete redirect URL
- Check that the request_token parameter is present

### "Failed to generate access token"
- Verify your API secret is correct
- Ensure the request token hasn't been used before
- Check that you're using the correct API key

### Script doesn't open browser
- Copy the login URL manually from the terminal
- Open it in your browser

## Security Best Practices

1. ✅ Never commit `.env` file to git
2. ✅ Keep API secret secure
3. ✅ Regenerate tokens if compromised
4. ✅ Use environment variables, not hardcoded values
5. ✅ Rotate tokens periodically

## Getting Kite Connect Credentials

If you don't have Kite Connect API credentials:

1. Go to https://kite.trade/
2. Sign up or log in
3. Go to Developer section
4. Create a new app
5. Get your API Key and API Secret
6. Set redirect URL (can be any valid URL for testing)

## Next Steps

After generating the access token:

1. ✅ Add it to `backend/.env`
2. ✅ Restart the backend server
3. ✅ Test with `/api/analyze` endpoint
4. ✅ Verify real stock data is being fetched

Happy trading! 📈

