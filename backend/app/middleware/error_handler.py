from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import uuid

class ErrorResponse:
    """Standardized error response format"""
    def __init__(self, error: str, code: int, request_id: str, details: str = None):
        self.error = error
        self.code = code
        self.request_id = request_id
        self.details = details

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    request_id = str(uuid.uuid4())
    
    error_response = ErrorResponse(
        error=exc.detail,
        code=exc.status_code,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.__dict__
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation exceptions"""
    request_id = str(uuid.uuid4())
    
    error_details = []
    for error in exc.errors():
        error_details.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    error_response = ErrorResponse(
        error="Validation failed",
        code=422,
        request_id=request_id,
        details=str(error_details)
    )
    
    return JSONResponse(
        status_code=422,
        content=error_response.__dict__
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions"""
    request_id = str(uuid.uuid4())
    
    # Log the full traceback for debugging
    print(f"Unhandled exception (Request ID: {request_id}):")
    traceback.print_exc()
    
    error_response = ErrorResponse(
        error="Internal server error",
        code=500,
        request_id=request_id,
        details="An unexpected error occurred. Please try again later."
    )
    
    return JSONResponse(
        status_code=500,
        content=error_response.__dict__
    )

async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle Starlette HTTP exceptions"""
    request_id = str(uuid.uuid4())
    
    error_response = ErrorResponse(
        error=exc.detail,
        code=exc.status_code,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.__dict__
    )
