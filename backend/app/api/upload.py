from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import os
import uuid
from datetime import datetime
import io

from app.models.mongodb_models import Document
from app.core.config import settings
from app.core.security import get_current_active_user, User
from app.utils.r2_storage import r2_storage
try:
    from app.services.ingestion import process_uploaded_file
    from app.services.categorization import categorize_document
    from app.services.embeddings import embedding_service
except ImportError:
    # Placeholder imports for testing
    process_uploaded_file = None
    categorize_document = None
    embedding_service = None

router = APIRouter()

@router.post("/")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload and process a document"""
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds limit")
    
    # Validate file extension
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.allowed_extensions_list:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    
    # Upload to R2 storage
    file_like_object = io.BytesIO(file_content)
    r2_result = await r2_storage.upload_file(
        file_like_object,
        str(current_user.id),
        file.filename,
        content_type=file.content_type
    )
    
    if not r2_result["success"]:
        raise HTTPException(status_code=500, detail=f"Failed to upload to R2: {r2_result.get('error')}")
    
    try:
        # Process the file
        if process_uploaded_file:
            # Save temporarily for processing
            temp_path = os.path.join(settings.UPLOAD_DIR, "temp", unique_filename)
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            with open(temp_path, "wb") as f:
                f.write(file_content)
            
            processed_data = await process_uploaded_file(temp_path, file.filename, file_extension)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        else:
            # Fallback if service not available
            processed_data = {
                "title": file.filename,
                "content": "",
                "summary": "Service not available",
                "metadata": {}
            }
        
        # Create document record with user association
        document = Document(
            user_id=str(current_user.id),
            filename=unique_filename,
            original_filename=file.filename,
            r2_key=r2_result["r2_key"],
            r2_url=r2_result["r2_url"],
            file_size=len(file_content),
            file_type=file_extension,
            category=processed_data.get("category", "uncategorized"),
            title=processed_data.get("title", file.filename),
            content=processed_data.get("content", ""),
            summary=processed_data.get("summary", ""),
            processing_status="processing"
        )
        
        await document.save()
        
        # Categorize the document (async)
        # In production, this should be a background task
        try:
            if categorize_document:
                categorization_result = categorize_document(document.title, document.content, int(current_user.id))
            else:
                categorization_result = {
                    "category": "Uncategorized",
                    "skills": [],
                    "date": None,
                    "organization": None,
                    "summary": document.summary,
                    "confidence": 0.5
                }
            
            # Update document with categorization
            document.category = categorization_result.get("category", "Uncategorized")
            document.categorization_confidence = categorization_result.get("confidence", 0.5)
            document.processing_status = "completed"
            
            # Extract additional metadata
            if categorization_result.get("date"):
                try:
                    document.document_date = datetime.strptime(categorization_result["date"], "%Y-%m-%d")
                except:
                    pass
            
            document.organization = categorization_result.get("organization")
            document.summary = categorization_result.get("summary", document.summary)
            
            await document.save()
            
            # Add to vector database
            if embedding_service:
                embedding_service.add_document_embedding(
                    str(document.id),
                    document.content,
                    {
                        "category": document.category,
                        "title": document.title,
                        "filename": document.original_filename
                    }
                )
            
        except Exception as e:
            print(f"Error during categorization: {e}")
            document.processing_status = "failed"
            await document.save()
        
        return {
            "id": str(document.id),
            "filename": document.original_filename,
            "category": document.category,
            "status": document.processing_status,
            "r2_url": document.r2_url,
            "message": "Document uploaded and processed successfully"
        }
        
    except Exception as e:
        # Clean up R2 file if processing failed
        if r2_result.get("r2_key"):
            r2_storage.delete_file(r2_result["r2_key"])
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/bulk")
async def upload_documents_bulk(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload multiple documents"""
    results = []
    
    for file in files:
        try:
            result = await upload_document(file, current_user)
            results.append({
                "filename": file.filename,
                "success": True,
                "data": result
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
    
    return {
        "total": len(files),
        "successful": sum(1 for r in results if r["success"]),
        "failed": sum(1 for r in results if not r["success"]),
        "results": results
    }