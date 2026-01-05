# Backend application package
import os
from dotenv import load_dotenv

# Robust .env loading - search in current dir, then 'backend/' dir
if os.path.exists(".env"):
    load_dotenv(".env")
elif os.path.exists("backend/.env"):
    load_dotenv("backend/.env")
else:
    # Default behavior (looks in CWD)
    load_dotenv()


