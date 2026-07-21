from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
from typing import List
import os
from datetime import datetime

from app.core.config import settings
from app.core.supabase_client import get_supabase

# Optional imports - make them non-blocking
ai_service = None
embedding_service = None

try:
    from app.services.ai_service import ai_service
except Exception as e:
    print(f"Warning: AI service not available: {e}")
    ai_service = None

try:
    from app.services.embeddings import embedding_service
except Exception as e:
    print(f"Warning: Embedding service not available: {e}")
    embedding_service = None

from app.middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    starlette_http_exception_handler
)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Digital Identity System"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register error handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    # Verify Supabase client connection
    try:
        get_supabase()
    except Exception as e:
        print(f"Warning: Supabase client initialization failed: {e}")

    print(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutting down")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}

# Include API routers
try:
    from app.api import upload, search, timeline, documents, auth, graph, insights, portfolio, integration

    app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
    app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
    app.include_router(search.router, prefix="/api/search", tags=["search"])
    app.include_router(timeline.router, prefix="/api/timeline", tags=["timeline"])
    app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
    app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
    app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
    app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
    app.include_router(integration.router, prefix="/api/integrations", tags=["integrations"])
except ImportError as e:
    print(f"Warning: Could not import API routers: {e}")
    print("Make sure all API modules are properly initialized")
except Exception as e:
    print(f"Warning: Error including API routers: {e}")
    print("Starting with limited functionality")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
