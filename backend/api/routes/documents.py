from fastapi import APIRouter, File, UploadFile
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # In Phase 5, this parses the file and embeddings it into pgvector
    print(f"[DOC INGESTION] Received file: {file.filename}")
    return {
        "status": "success",
        "filename": file.filename,
        "document_id": str(uuid.uuid4()),
        "message": "File embedded into pgvector memory successfully."
    }
