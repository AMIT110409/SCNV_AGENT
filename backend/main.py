from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "agents"))
from scm_analyst import STOClassifier

# Import new API Routers
from api.routes import auth, admin, chat, alerts, documents

app = FastAPI(title="SCNV Agent API", description="Supply Chain Network Visibility Multi-Agent Backend")

# Add CORS Middleware to allow React/Vite Frontend (localhost:5173 / localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes matching frontend api.js
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Agent Chat"])
app.include_router(chat.router, prefix="/api/history", tags=["Chat History"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Configuration"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Human-in-the-loop Alerts"])
app.include_router(documents.router, prefix="/api/documents", tags=["Knowledge Base Ingestion"])

class STOEvent(BaseModel):
    sto_id: str
    source_location: str
    destination_location: str
    sku_id: str
    quantity: float

classifier = STOClassifier()

@app.post("/stos/classify", summary="Classify a single STO event using Rules 1-4")
async def classify_sto(sto: STOEvent):
    """
    Receives an STO event, runs it through the deterministic Rules 1-4 engine, and returns the classification.
    """
    try:
        sto_dict = sto.dict()
        result = classifier.classify_sto(sto_dict)
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", tags=["System Diagnostics"])
async def health_check():
    return {"status": "healthy"}
