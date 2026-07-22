from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class UserProfile(BaseModel):
    age_group: str
    infertility_cause: Optional[str] = None
    treatment_interest: Optional[str] = None
    current_stage: Optional[str] = None
    user_question: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    profile: Optional[UserProfile] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    answer: str
    cards: Optional[List[Dict[str, Any]]] = None
    safety_notice: str


class StatsResponse(BaseModel):
    title: str
    description: str
    data: List[Dict[str, Any]]
