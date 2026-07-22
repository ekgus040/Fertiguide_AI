from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.stats_service import (
    get_age_cause_summary,
    get_process_summary,
    get_attempt_summary,
    get_annual_treatment_stats,
    get_fertility_place_summary,
    get_fertility_places,
    get_institution_summary,
)

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/age-cause")
def age_cause_stats(age_group: str, infertility_cause: str | None = None, db: Session = Depends(get_db)):
    data = get_age_cause_summary(db=db, age_group=age_group, infertility_cause=infertility_cause)

    return {
        "title": f"{age_group} 난임 원인별 시술 현황",
        "description": "HIRA 난임시술유형별 연령별 원인별 현황 데이터를 기반으로 한 참고 정보입니다.",
        "data": data,
    }


@router.get("/process")
def process_stats(age_group: str, treatment_type: str | None = None, db: Session = Depends(get_db)):
    data = get_process_summary(db=db, age_group=age_group, treatment_type=treatment_type)

    return {
        "title": f"{age_group} 시술 과정별 현황",
        "description": "인공수정, 신선배아, 동결배아의 시술 과정별 건수를 보여줍니다.",
        "data": data,
    }


@router.get("/attempt")
def attempt_stats(treatment_type: str | None = None, db: Session = Depends(get_db)):
    data = get_attempt_summary(db=db, treatment_type=treatment_type)

    return {
        "title": "시술 차수별 현황",
        "description": "시술 전 과정 1건 기준이며, 중단된 건도 포함될 수 있습니다.",
        "data": data,
    }


@router.get("/institution")
def institution_stats(treatment_type: str | None = None, db: Session = Depends(get_db)):
    data = get_institution_summary(db=db, treatment_type=treatment_type)

    return {
        "title": "의료기관 종별 현황",
        "description": "난임시술 지정 의료기관 종별 현황을 보여줍니다.",
        "data": data,
    }


@router.get("/places")
def fertility_places(institution_type: str | None = None, region: str | None = None, db: Session = Depends(get_db)):
    data = get_fertility_places(db=db, institution_type=institution_type, region=region)

    return {
        "title": "난임시술 의료기관 목록",
        "description": "정부 지정 체외수정 의료기관 현황 자료를 기반으로 한 기관 목록입니다.",
        "data": data,
    }


@router.get("/places/summary")
def fertility_place_summary(db: Session = Depends(get_db)):
    data = get_fertility_place_summary(db=db)

    return {
        "title": "난임시술 의료기관 분포",
        "description": "지역과 의료기관 종별 기준의 기관 수 분포입니다.",
        "data": data,
    }


@router.get("/annual-treatment")
def annual_treatment_stats(db: Session = Depends(get_db)):
    data = get_annual_treatment_stats(db=db)

    return {
        "title": "연도별 난임시술 현황",
        "description": "국민건강보험공단 연도별 난임시술 현황 자료입니다.",
        "data": data,
    }
