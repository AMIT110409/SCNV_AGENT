from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ExecuteActionRequest(BaseModel):
    action: str
    overrideReason: str | None = ""

# Mock STOs pending human review
MOCK_PENDING_STOS = [
    {
        "id": "STO-9921",
        "source": "DC_North",
        "destination": "Store_44",
        "item": "Laptops-X1",
        "quantity": 50,
        "reason": "High Risk - Lead Time Violation",
        "timestamp": "10 mins ago",
        "escalatesIn": "1h 50m",
        "status": "pending",
        "severity": "high"
    }
]

@router.get("/pending")
async def get_pending_alerts():
    return {"alerts": MOCK_PENDING_STOS}

@router.post("/{sto_id}/execute")
async def execute_sto_action(sto_id: str, action_req: ExecuteActionRequest):
    action = action_req.action
    reason = action_req.overrideReason
    
    print(f"[ALERTS MODULE] Processing STO {sto_id} with action '{action}'. Reason: {reason}")
    # In a real app, this updates Postgres and triggers PyCelonis/SAP webhook
    return {"status": "success", "sto_id": sto_id, "action": action, "logged_to_memory": True}
