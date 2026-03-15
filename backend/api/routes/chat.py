from fastapi import APIRouter
from pydantic import BaseModel
import uuid
import datetime

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class SessionSaveRequest(BaseModel):
    session_id: str
    title: str
    messages: list

import sys
import os

try:
    from orchestrator import Orchestrator
    orchestrator = Orchestrator()
except Exception as e:
    print(f"Warning: Orchestrator failed to load: {e}")
    orchestrator = None

@router.post("/")
async def chat(req: ChatRequest):
    if not orchestrator:
        return {"answer": "Error: Orchestrator offline.", "sources": []}
        
    # Dummy NLP parsing for MVP: extracting simple keywords from the chat to feed the Graph Node
    dummy_sto = {
        "sto_id": f"MSG-{uuid.uuid4().hex[:6]}",
        "source_location": "DC_North" if "DC" in req.message else "Unknown",
        "destination_location": "Store_44",
        "sku_id": "Laptops-X1" if "Laptop" in req.message else "Unknown",
        "quantity": 50
    }
    
    # Execute LangGraph Pipeline (Runs Neo4j Node -> SCM Analyst -> Optimizer -> etc)
    final_state = orchestrator.process_sto_event(dummy_sto)
    
    # Extract the graph memory and map to Phase 5 Frontend array
    sources = getattr(final_state, 'graph_context', [])
    if not sources:
        sources.append({
            "type": "neo4j",
            "source": "Agent Navigation",
            "confidence": 0.5,
            "text_snippet": "No distinct alternative graphs resolved."
        })
        
    return {
        "answer": f"LangGraph Analysis complete. Classification: {final_state.classification}. Confidence: {final_state.confidence}. Reasoning: {final_state.reasoning_text}",
        "sources": sources
    }

@router.get("/sessions")
async def get_sessions():
    return {
        "sessions": [
            {"id": str(sid), "timestamp": data["timestamp"], "title": data["title"]}
            for sid, data in SESSIONS_DB.items()
        ]
    }

@router.post("/sessions/new")
async def save_session(req: SessionSaveRequest):
    SESSIONS_DB[req.session_id] = {
        "title": req.title,
        "messages": req.messages,
        "timestamp": datetime.datetime.now().isoformat()
    }
    return {"status": "saved"}

@router.get("/sessions/{session_id}")
async def load_session(session_id: str):
    if session_id in SESSIONS_DB:
        return SESSIONS_DB[session_id]
    return {"messages": []}
