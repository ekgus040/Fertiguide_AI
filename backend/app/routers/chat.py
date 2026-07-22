from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ChatRequest
from app.services.stats_service import get_age_cause_insights, get_age_cause_summary, get_process_summary, get_attempt_summary
from app.services.chatbot_service import PROFILE_CONFLICT_ANSWER, generate_chat_answer, has_profile_conflict

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    profile = request.profile.model_dump() if request.profile else {}

    age_group = profile.get("age_group")
    infertility_cause = profile.get("infertility_cause")
    treatment_interest = profile.get("treatment_interest")

    if has_profile_conflict(request.message, profile):
        return {
            "answer": PROFILE_CONFLICT_ANSWER,
            "cards": [],
            "safety_notice": "프로필 정보가 현재 질문과 달라 새로고침 후 다시 입력하도록 안내했습니다."
        }

    stats = {}

    if age_group:
        stats["age_cause"] = get_age_cause_summary(
            db=db,
            age_group=age_group,
            infertility_cause=infertility_cause
        )
        stats["age_cause_insights"] = get_age_cause_insights(
            db=db,
            age_group=age_group,
            infertility_cause=infertility_cause
        )

        stats["process"] = get_process_summary(
            db=db,
            age_group=age_group,
            treatment_type=treatment_interest
        )

    if treatment_interest:
        stats["attempt"] = get_attempt_summary(
            db=db,
            treatment_type=treatment_interest
        )

    answer = generate_chat_answer(
        message=request.message,
        profile=profile,
        stats=stats,
        conversation_history=request.conversation_history or [],
    )

    return {
        "answer": answer,
        "cards": [
            {
                "type": "age_cause",
                "title": "연령대·원인별 시술 현황",
                "data": stats.get("age_cause_insights", {}),
            },
            {
                "type": "process",
                "title": "시술 과정별 현황",
                "data": stats.get("process", []),
            },
            {
                "type": "attempt",
                "title": "시술 차수별 현황",
                "data": stats.get("attempt", []),
            }
        ],
        "safety_notice": "이 정보는 공공데이터 기반 참고자료이며, 개인의 진단이나 치료방침을 결정하지 않습니다. 정확한 판단은 난임 전문 의료진과 상담하세요."
    }
