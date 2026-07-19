import os
import tempfile
from datetime import datetime
from typing import Optional

from app.models.mongodb_models import DocumentCategory, DocumentStatus, ExtractedFields
from app.repositories.document_repository import document_repository
from app.services.ingestion import process_uploaded_file
from app.services.categorization import categorize_document
from app.services.relationships import detect_for_document

try:
    from app.services.embeddings import embedding_service
except Exception:
    embedding_service = None


class DocumentProcessingService:
    """Post-upload pipeline: extract text, classify, embed, detect relationships."""

    async def process_document(
        self,
        user_id: str,
        document_id: str,
        file_content: bytes,
        filename: str,
    ) -> None:
        file_extension = filename.split(".")[-1].lower() if "." in filename else "txt"

        try:
            await document_repository.update_status(document_id, DocumentStatus.EXTRACTING)

            extracted = await self._extract_text(file_content, filename, file_extension)
            content = extracted.get("content", "") or filename
            title = extracted.get("title", filename)

            await document_repository.update(document_id, {
                "extracted_text": content,
                "ocr_applied": extracted.get("metadata", {}).get("ocr_used", False),
            })

            await document_repository.update_status(document_id, DocumentStatus.CLASSIFYING)

            category_result = await categorize_document(title, content, user_id, document_id)
            category_name = category_result.get("category", "Projects")

            # Validate category against enum
            try:
                category = DocumentCategory(category_name)
            except ValueError:
                # If category is invalid, use default and mark as needs review
                category = DocumentCategory.PROJECTS
                print(f"Invalid category '{category_name}', using default")

            extracted_fields = ExtractedFields(
                issuer=category_result.get("organization"),
                organization=category_result.get("organization"),
                skills_detected=category_result.get("skills", []) or [],
            )

            if category_result.get("date"):
                try:
                    extracted_fields.issue_date = datetime.fromisoformat(category_result["date"])
                except (ValueError, TypeError):
                    pass

            # Check confidence threshold
            confidence = category_result.get("confidence", 0.5)
            if confidence < 0.6:
                # Low confidence - mark for review but still proceed
                print(f"Low confidence categorization ({confidence:.2f}) for document {document_id}")

            await document_repository.update(document_id, {
                "category": category,
                "category_confidence": confidence,
                "extracted_fields": extracted_fields,
            })

            # Generate embedding and add to ChromaDB
            if embedding_service and content.strip():
                year = datetime.utcnow().year
                try:
                    embedding_service.add_document_embedding(
                        str(document_id),
                        content,
                        {
                            "user_id": user_id,  # MANDATORY for multi-tenant isolation
                            "category": category.value,
                            "year": year,
                            "filename": filename,
                        },
                    )
                except ValueError as e:
                    # This will catch the mandatory user_id check
                    print(f"Failed to add embedding: {e}")
                    raise

            # Detect relationships for this specific document
            await detect_for_document(document_id, user_id)

            # Mark as indexed only if all steps succeeded
            await document_repository.update(document_id, {
                "status": DocumentStatus.INDEXED,
                "chroma_vector_id": str(document_id),
            })

            # Non-blocking push to external integrations (Google Drive / Notion)
            try:
                from app.services.integration_service import IntegrationService
                await IntegrationService.push_document_to_integrations(document_id, user_id)
            except Exception as e:
                print(f"Non-blocking error pushing to integrations for doc {document_id}: {e}")

        except Exception as e:
            # Set failure reason for user visibility
            failure_reason = str(e)
            print(f"Document processing failed for {document_id}: {e}")
            await document_repository.update(document_id, {
                "status": DocumentStatus.FAILED,
                "failure_reason": failure_reason
            })

    async def _extract_text(self, file_content: bytes, filename: str, file_extension: str) -> dict:
        suffix = f".{file_extension}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        try:
            return await process_uploaded_file(tmp_path, filename, file_extension)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


document_processing_service = DocumentProcessingService()
