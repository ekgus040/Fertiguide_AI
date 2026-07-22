from fastapi import APIRouter
from app.schemas import UserProfile

router = APIRouter(prefix="/report", tags=["report"])


@router.post("")
def create_report(profile: UserProfile):
    return {
        "title": "나의 난임 상담 준비 리포트",
        "profile": profile.model_dump(),
        "sections": [
            "내 상황 요약",
            "관심 시술 설명",
            "공공데이터 기반 참고 통계",
            "병원 상담 질문",
            "방문 전 체크리스트",
            "의료진 상담 안내 문구",
        ],
        "notice": "이 리포트는 상담 준비용 참고자료이며, 진단이나 치료방침을 결정하지 않습니다."
    }
