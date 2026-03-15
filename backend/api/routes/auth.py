from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import uuid
import datetime

router = APIRouter()

# --- Mock Databases for Phase MVP ---
MOCK_USERS = {
    "admin@akzonobel.com": {"password": "password123", "role": "admin"},
    "analyst@akzonobel.com": {"password": "password123", "role": "analyst"}
}

class LoginRequest(BaseModel):
    # Depending on how frontend sends it (JSON vs Form). Frontend api.js sends Form.
    # FastAPI usually expects OAuth2PasswordRequestForm for form data, but we'll accept JSON too for flexibility.
    username: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str

@router.post("/register")
async def register(req: RegisterRequest):
    if req.email in MOCK_USERS:
        raise HTTPException(status_code=400, detail="User already exists")
    
    MOCK_USERS[req.email] = {"password": req.password, "role": req.role}
    return {"message": "User registered successfully", "email": req.email}

@router.post("/login")
async def login(username: str = None, password: str = None):
    # In a real app, use OAuth2PasswordRequestForm.
    user_record = MOCK_USERS.get(username)
    if not user_record or user_record["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    role = user_record["role"]
    return {
        "access_token": f"mock_jwt_token_{uuid.uuid4()}",
        "token_type": "bearer",
        "role": role
    }
