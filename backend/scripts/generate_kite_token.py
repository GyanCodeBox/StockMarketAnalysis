"""
Script to generate Kite Connect Access Token automatically

This script handles the OAuth flow to get an access token from Kite Connect.
"""
import os
import sys
import webbrowser
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

try:
    from kiteconnect import KiteConnect
except ImportError:
    print("ERROR: kiteconnect not installed. Run: pip install kiteconnect")
    sys.exit(1)


def generate_access_token():
    """
    Generate Kite Connect access token using OAuth flow
    
    Steps:
    1. Get login URL from Kite Connect
    2. User logs in via browser
    3. Extract request token from redirect URL
    4. Exchange request token for access token
    """
    api_key = os.getenv("KITE_API_KEY", "").strip()
    api_secret = os.getenv("KITE_API_SECRET", "").strip()
    
    if not api_key:
        print("ERROR: KITE_API_KEY not found in .env file")
        print("Please add KITE_API_KEY to backend/.env")
        return None
    
    if not api_secret:
        print("ERROR: KITE_API_SECRET not found in .env file")
        print("Please add KITE_API_SECRET to backend/.env")
        return None
    
    # Initialize Kite Connect
    kite = KiteConnect(api_key=api_key)
    
    # Step 1: Get login URL
    print("\n" + "="*60)
    print("Kite Connect Access Token Generator")
    print("="*60)
    print(f"\nAPI Key: {api_key[:10]}...{api_key[-5:]}")
    print("\nStep 1: Opening login URL in your browser...")
    
    login_url = kite.login_url()
    print(f"\nLogin URL: {login_url}")
    print("\nIf browser didn't open, copy the URL above and open it manually.")
    
    # Try to open browser
    try:
        webbrowser.open(login_url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}")
    
    # Step 2: Get request token from user
    print("\n" + "-"*60)
    print("Step 2: After logging in, you'll be redirected to a URL.")
    print("Copy the ENTIRE redirect URL from your browser's address bar.")
    print("-"*60)
    
    redirect_url = input("\nPaste the redirect URL here: ").strip()
    
    if not redirect_url:
        print("ERROR: No URL provided")
        return None
    
    # Step 3: Extract request token from redirect URL
    try:
        parsed_url = urlparse(redirect_url)
        query_params = parse_qs(parsed_url.query)
        
        if 'request_token' not in query_params:
            print("ERROR: request_token not found in URL")
            print("Make sure you copied the complete redirect URL")
            return None
        
        request_token = query_params['request_token'][0]
        print(f"\n✓ Request token extracted: {request_token[:20]}...")
        
    except Exception as e:
        print(f"ERROR: Failed to parse URL: {e}")
        return None
    
    # Step 4: Generate access token
    print("\nStep 3: Generating access token...")
    try:
        data = kite.generate_session(request_token, api_secret=api_secret)
        access_token = data['access_token']
        
        print("\n" + "="*60)
        print("✓ SUCCESS! Access token generated")
        print("="*60)
        print(f"\nAccess Token: {access_token}")
        print(f"\nUser ID: {data.get('user_id', 'N/A')}")
        print(f"User Name: {data.get('user_name', 'N/A')}")
        print(f"Email: {data.get('email', 'N/A')}")
        print(f"Broker: {data.get('broker', 'N/A')}")
        
        # Step 5: Update .env file
        print("\n" + "-"*60)
        update_env = input("Update .env file with this access token? (y/n): ").strip().lower()
        
        if update_env == 'y':
            env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
            
            # Read current .env
            env_content = ""
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    env_content = f.read()
            
            # Update or add KITE_ACCESS_TOKEN
            if 'KITE_ACCESS_TOKEN=' in env_content:
                lines = env_content.split('\n')
                updated_lines = []
                for line in lines:
                    if line.startswith('KITE_ACCESS_TOKEN='):
                        updated_lines.append(f'KITE_ACCESS_TOKEN={access_token}')
                    else:
                        updated_lines.append(line)
                env_content = '\n'.join(updated_lines)
            else:
                if env_content and not env_content.endswith('\n'):
                    env_content += '\n'
                env_content += f'KITE_ACCESS_TOKEN={access_token}\n'
            
            # Write back to .env
            with open(env_path, 'w') as f:
                f.write(env_content)
            
            print(f"\n✓ Updated {env_path} with access token")
        else:
            print("\nPlease add this to your .env file manually:")
            print(f"KITE_ACCESS_TOKEN={access_token}")
        
        print("\n" + "="*60)
        print("You can now use the Kite Connect API!")
        print("="*60 + "\n")
        
        return access_token
        
    except Exception as e:
        print(f"\nERROR: Failed to generate access token: {e}")
        print("\nCommon issues:")
        print("1. Request token expired (tokens expire quickly)")
        print("2. Invalid API secret")
        print("3. Request token already used")
        print("\nPlease try again with a fresh login.")
        return None


if __name__ == "__main__":
    generate_access_token()

