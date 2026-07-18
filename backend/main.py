from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import List
import os
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db
from app.core.mongodb import init_mongodb, close_mongodb
from app.services.ai_service import ai_service
from app.services.embeddings import embedding_service

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

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    # Initialize SQLite (legacy, for compatibility)
    init_db()
    
    # Initialize MongoDB (primary database)
    await init_mongodb()
    
    print(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully")

# Close database on shutdown
@app.on_event("shutdown")
async def shutdown_event():
    await close_mongodb()
    print("MongoDB connection closed")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}

# Include API routers
try:
    from app.api import upload, search, timeline, documents, auth

    app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
    app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
    app.include_router(search.router, prefix="/api/search", tags=["search"])
    app.include_router(timeline.router, prefix="/api/timeline", tags=["timeline"])
    app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
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