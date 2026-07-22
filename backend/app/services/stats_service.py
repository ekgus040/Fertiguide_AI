from sqlalchemy.orm import Session
from app.models import (
    AgeCauseStat,
    AnnualInfertilityTreatmentStat,
    AttemptStat,
    FertilityPlace,
    InstitutionStat,
    ProcessStat,
)


CAUSE_COLUMN_MAP = {
    "남성요인": "male_factor_count",
    "배란기능장애": "ovulation_disorder_count",
    "난소기능저하": "ovarian_decline_count",
    "난관요인": "tubal_factor_count",
    "자궁요인": "uterine_factor_count",
    "자궁내막증": "endometriosis_count",
    "원인불명": "unexplained_count",
    "기타요인": "other_count",
    "복합요인": "complex_count",
}

TREATMENT_DESCRIPTIONS = {
    "인공수정": "배란 시기에 맞춰 처리한 정자를 자궁 안에 주입하는 방식입니다. 비교적 초기 단계에서 검토되는 경우가 많습니다.",
    "체외수정": "난자와 정자를 몸 밖에서 수정한 뒤 배아를 자궁에 이식하는 방식입니다. 신선배아와 동결배아 과정으로 나뉠 수 있습니다.",
    "신선배아": "난자 채취와 수정 후 배아를 동결하지 않고 같은 주기에 이식하는 방식입니다.",
    "동결배아": "배아를 동결 보관한 뒤 이후 주기에 해동하여 이식하는 방식입니다.",
}


def normalize_age_group(age_group: str | None) -> str | None:
    if not age_group:
        return age_group

    return (
        age_group.strip()
        .replace("-", "~")
        .replace("25세미만", "25세 미만")
        .replace("45세이상", "45세 이상")
    )


def normalize_treatment_filter(treatment_type: str | None) -> str | None:
    if treatment_type in ["신선배아", "동결배아"]:
        return treatment_type
    if treatment_type == "체외수정":
        return None
    if treatment_type == "아직 모름":
        return None
    return treatment_type


def attempt_round_sort_key(item: dict) -> int:
    attempt_round = item.get("attempt_round") or ""
    if "10" in attempt_round:
        return 10
    digits = "".join(char for char in attempt_round if char.isdigit())
    return int(digits) if digits else 99


def _age_sort_key(age_group: str | None) -> int:
    if not age_group:
        return 99
    digits = "".join(char for char in age_group if char.isdigit())
    return int(digits[:2]) if digits else 99


def _age_cause_item(row: AgeCauseStat, infertility_cause: str | None = None) -> dict:
    item = {
        "year": row.year,
        "treatment_type": row.treatment_type,
        "age_group": row.age_group,
        "total_count": row.total_count,
    }

    if infertility_cause and infertility_cause in CAUSE_COLUMN_MAP:
        column_name = CAUSE_COLUMN_MAP[infertility_cause]
        item["selected_cause"] = infertility_cause
        item["selected_cause_count"] = getattr(row, column_name)

    return item


def get_age_cause_summary(db: Session, age_group: str, infertility_cause: str | None = None):
    rows = (
        db.query(AgeCauseStat)
        .filter(AgeCauseStat.age_group == normalize_age_group(age_group))
        .order_by(AgeCauseStat.year.desc(), AgeCauseStat.treatment_type.asc())
        .all()
    )
    result = []

    for row in rows:
        result.append(_age_cause_item(row, infertility_cause))

    return result


def get_age_cause_insights(db: Session, age_group: str, infertility_cause: str | None = None):
    selected_age_group = normalize_age_group(age_group)
    selected_rows = (
        db.query(AgeCauseStat)
        .filter(AgeCauseStat.age_group == selected_age_group)
        .order_by(AgeCauseStat.year.desc(), AgeCauseStat.treatment_type.asc())
        .all()
    )
    selected_year = selected_rows[0].year if selected_rows else None

    all_rows_query = db.query(AgeCauseStat)
    if selected_year:
        all_rows_query = all_rows_query.filter(AgeCauseStat.year == selected_year)
    all_rows = all_rows_query.all()

    cause_column = CAUSE_COLUMN_MAP.get(infertility_cause or "")

    treatment_comparison = [
        _age_cause_item(row, infertility_cause)
        for row in selected_rows
    ]

    selected_cause_total = 0
    selected_cause_by_treatment = []
    if cause_column:
        for row in selected_rows:
            cause_count = getattr(row, cause_column)
            selected_cause_total += cause_count
            selected_cause_by_treatment.append(
                {
                    "treatment_type": row.treatment_type,
                    "count": cause_count,
                    "total_count": row.total_count,
                    "share": round((cause_count / row.total_count) * 100, 1) if row.total_count else 0,
                }
            )

    age_totals = {}
    for row in all_rows:
        if row.age_group not in age_totals:
            age_totals[row.age_group] = {
                "age_group": row.age_group,
                "total_count": 0,
                "selected_cause_count": 0,
            }

        age_totals[row.age_group]["total_count"] += row.total_count or 0
        if cause_column:
            age_totals[row.age_group]["selected_cause_count"] += getattr(row, cause_column) or 0

    position_metric = "selected_cause_count" if cause_column else "total_count"
    age_position = sorted(
        age_totals.values(),
        key=lambda item: (-item[position_metric], _age_sort_key(item["age_group"])),
    )
    for index, item in enumerate(age_position, start=1):
        item["rank"] = index
        item["is_selected"] = item["age_group"] == selected_age_group

    age_position = sorted(age_position, key=lambda item: _age_sort_key(item["age_group"]))
    selected_position = next((item for item in age_position if item["is_selected"]), None)

    return {
        "year": selected_year,
        "selected_age_group": selected_age_group,
        "selected_cause": infertility_cause,
        "treatment_comparison": treatment_comparison,
        "selected_cause_total": selected_cause_total if cause_column else None,
        "selected_cause_by_treatment": selected_cause_by_treatment,
        "age_position": age_position,
        "selected_position": selected_position,
        "position_metric": position_metric,
        "treatment_descriptions": [
            {
                "treatment_type": treatment_type,
                "description": description,
            }
            for treatment_type, description in TREATMENT_DESCRIPTIONS.items()
        ],
    }


def get_process_summary(db: Session, age_group: str, treatment_type: str | None = None):
    query = db.query(ProcessStat).filter(ProcessStat.age_group == normalize_age_group(age_group))

    # 체외수정은 신선배아/동결배아를 모두 보여주는 편이 MVP에서 더 자연스럽습니다.
    treatment_filter = normalize_treatment_filter(treatment_type)
    if treatment_filter:
        query = query.filter(ProcessStat.treatment_type == treatment_filter)

    rows = query.order_by(ProcessStat.year.desc(), ProcessStat.treatment_type.asc()).all()

    return [
        {
            "year": row.year,
            "treatment_type": row.treatment_type,
            "age_group": row.age_group,
            "ovulation_induction_count": row.ovulation_induction_count,
            "sperm_retrieval_count": row.sperm_retrieval_count,
            "egg_retrieval_count": row.egg_retrieval_count,
            "fertilization_count": row.fertilization_count,
            "completed_count": row.completed_count,
        }
        for row in rows
    ]


def get_attempt_summary(db: Session, treatment_type: str | None = None):
    query = db.query(AttemptStat)

    if treatment_type and treatment_type not in ["아직 모름", "신선배아", "동결배아"]:
        query = query.filter(AttemptStat.treatment_type == treatment_type)
    elif treatment_type in ["신선배아", "동결배아"]:
        query = query.filter(AttemptStat.treatment_type == "체외수정")

    rows = query.order_by(AttemptStat.year.desc(), AttemptStat.attempt_round.asc()).all()

    result = [
        {
            "year": row.year,
            "treatment_type": row.treatment_type,
            "attempt_round": row.attempt_round,
            "total_count": row.total_count,
        }
        for row in rows
    ]

    return sorted(result, key=attempt_round_sort_key)


def get_institution_summary(db: Session, treatment_type: str | None = None):
    query = db.query(InstitutionStat)

    if treatment_type:
        query = query.filter(InstitutionStat.treatment_type == treatment_type)

    rows = query.all()

    return [
        {
            "year": row.year,
            "treatment_type": row.treatment_type,
            "institution_type": row.institution_type,
            "institution_count": row.institution_count,
            "treatment_count": row.treatment_count,
        }
        for row in rows
    ]


def get_fertility_places(db: Session, institution_type: str | None = None, region: str | None = None):
    query = db.query(FertilityPlace)

    if institution_type:
        query = query.filter(FertilityPlace.institution_type == institution_type)
    if region:
        query = query.filter(FertilityPlace.region == region)

    rows = query.order_by(FertilityPlace.region.asc(), FertilityPlace.sequence.asc()).all()

    return [
        {
            "sequence": row.sequence,
            "region": row.region,
            "institution_name": row.institution_name,
            "institution_type": row.institution_type,
            "address": row.address,
            "phone": row.phone,
        }
        for row in rows
    ]


def get_fertility_place_summary(db: Session):
    rows = db.query(FertilityPlace).all()
    by_region = {}
    by_type = {}

    for row in rows:
        by_region[row.region] = by_region.get(row.region, 0) + 1
        by_type[row.institution_type] = by_type.get(row.institution_type, 0) + 1

    return {
        "total_count": len(rows),
        "by_region": [
            {"region": region, "count": count}
            for region, count in sorted(by_region.items(), key=lambda item: (-item[1], item[0] or ""))
        ],
        "by_type": [
            {"institution_type": institution_type, "count": count}
            for institution_type, count in sorted(by_type.items(), key=lambda item: (-item[1], item[0] or ""))
        ],
        "sample_places": get_fertility_places(db)[:12],
    }


def get_annual_treatment_stats(db: Session):
    rows = db.query(AnnualInfertilityTreatmentStat).order_by(AnnualInfertilityTreatmentStat.year.asc()).all()

    return [
        {
            "year": row.year,
            "patient_count": row.patient_count,
            "treatment_count": row.treatment_count,
            "treatments_per_person": row.treatments_per_person,
        }
        for row in rows
    ]
