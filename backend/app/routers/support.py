from fastapi import APIRouter, Query

from app.services.seoul_support_service import get_seoul_pregnancy_supports

router = APIRouter(prefix="/support", tags=["support"])


@router.get("/seoul-pregnancy")
def seoul_pregnancy_supports(
    limit: int = Query(default=12, ge=1, le=30),
    stage: str = Query(default="pregnancy", pattern="^(pregnancy|birth|all)$"),
):
    return get_seoul_pregnancy_supports(limit=limit, stage=stage)
