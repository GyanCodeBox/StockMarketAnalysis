"""
FastAPI main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.routes_auth import router as auth_router
from app.config import logger

app = FastAPI(
    title="Agentic AI Stock Analysis API",
    description="API for AI-powered stock analysis using LangGraph agents",
    version="1.0.0"
)

# CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")
app.include_router(auth_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Agentic AI Stock Analysis API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

