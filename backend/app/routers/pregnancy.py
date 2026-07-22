from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.pregnancy_rag_service import answer_pregnancy_possibility

router = APIRouter(prefix="/pregnancy", tags=["pregnancy"])


class PregnancyPossibilityRequest(BaseModel):
    last_relation_at: Optional[str] = None
    contraception: Optional[str] = None
    contraception_issue: Optional[str] = None
    last_period_start: Optional[str] = None
    expected_period: Optional[str] = None
    symptoms: Optional[str] = None
    question: Optional[str] = None
    conversation_history: Optional[list[dict[str, str]]] = None
    is_follow_up: bool = False


@router.post("/possibility")
def pregnancy_possibility(request: PregnancyPossibilityRequest):
    return answer_pregnancy_possibility(request.model_dump())
