import csv
from pathlib import Path

SEOUL_SUPPORT_SOURCE = "서울열린데이터광장 몽땅정보 만능키 사업 정보"
SEOUL_ONLY_MESSAGE = "서울시 한정 지원사업 정보입니다. 다른 지역에 대한 지원 사업은 추후 업데이트 예정입니다."
LOCAL_SUPPORT_CSV = "seoul_supports.csv"
PREGNANCY_KEYWORDS = [
    "임신",
    "출산",
    "임산부",
    "산모",
    "첫만남",
    "양육",
    "돌봄",
    "건강",
]

SUPPORT_STAGE_KEYWORDS = {
    "pregnancy": [
        "임신",
        "임산부",
        "산모",
        "출산전",
        "태아",
        "청소년산모",
        "맘편한",
        "교통비",
        "진료비",
        "검사비",
    ],
    "birth": [
        "출산",
        "육아",
        "양육",
        "돌봄",
        "보육",
        "신생아",
        "영유아",
        "아이",
        "아동",
        "수유",
        "휴직",
        "출산휴가",
        "첫만남",
        "부모급여",
        "보육료",
    ],
}

LOCAL_SUPPORT_FIELDS = [
    "사업대분류명",
    "사업중분류명",
    "사업소분류명",
    "사업명",
    "사업내용",
    "이용대상내용",
    "이용방법내용",
    "운영시간내용",
    "문의처내용",
    "대상지역",
    "대상아동나이",
    "대상관심",
    "자세히보기사이트주소",
    "신청하기사이트주소",
]


def _contains_pregnancy_keyword(row: dict) -> bool:
    haystack = " ".join(str(row.get(field) or "") for field in LOCAL_SUPPORT_FIELDS)
    return any(keyword in haystack for keyword in PREGNANCY_KEYWORDS)


def _matches_support_stage(row: dict, stage: str) -> bool:
    if stage not in SUPPORT_STAGE_KEYWORDS:
        return True

    major = str(row.get("사업대분류명") or "")
    middle = str(row.get("사업중분류명") or "")
    small = str(row.get("사업소분류명") or "")
    name = str(row.get("사업명") or "")
    category_text = " ".join([major, middle, small])
    title_text = " ".join([category_text, name])

    if stage == "pregnancy":
        pregnancy_major = major in {"임신", "임신준비", "임신(준비)"}
        pregnancy_category = any(keyword in category_text for keyword in ["임산부 지원", "산모 검사", "난임 부부지원"])
        pregnancy_title = any(
            keyword in name
            for keyword in ["임신", "임산부", "청소년산모", "맘편한", "교통비", "검사비", "진료비", "난임"]
        )
        return pregnancy_major or pregnancy_category or pregnancy_title

    if stage == "birth":
        birth_major = major in {"출산", "육아", "양육", "안심돌봄", "일생활균형", "탄생응원", "편한외출"}
        birth_title = any(
            keyword in title_text
            for keyword in ["출산", "육아", "양육", "돌봄", "보육", "신생아", "영유아", "첫만남", "휴직", "출산휴가", "수유"]
        )
        pregnancy_only_title = any(keyword in name for keyword in ["임신 원스톱", "임산부 교통비", "임산부 할인", "임산부 외래"])
        return (birth_major or birth_title) and not pregnancy_only_title

    return True


def _stage_sort_key(row: dict, stage: str) -> tuple[int, str]:
    major = str(row.get("사업대분류명") or "")
    middle = str(row.get("사업중분류명") or "")
    name = str(row.get("사업명") or "")
    text = " ".join([major, middle, name])

    if stage == "pregnancy":
        if major == "임신":
            priority = 0
        elif "임산부" in text or "산모 검사" in text:
            priority = 1
        elif major in {"임신준비", "임신(준비)"}:
            priority = 2
        else:
            priority = 3
    elif stage == "birth":
        if any(keyword in name for keyword in ["첫만남", "출산급여", "출산휴가", "산모", "신생아", "수유"]):
            priority = 0
        elif major == "출산":
            priority = 1
        elif any(keyword in name for keyword in ["육아휴직", "부모급여", "보육료", "양육수당", "아이돌봄"]):
            priority = 2
        elif major == "양육":
            priority = 3
        elif major == "육아":
            priority = 4
        else:
            priority = 5
    else:
        priority = 0

    return priority, name


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None

    text = str(value).strip()
    if not text or text == ".":
        return None

    text = text.replace("?", "·")
    text = " ".join(text.split())
    text = text.replace(" · ", "·")
    text = text.replace("·", " · ")
    return " ".join(text.split())


def _clean_url(value: str | None) -> str | None:
    if not value or value.strip() in ["", "."]:
        return None
    return value.strip()


def _normalize_support(row: dict) -> dict:
    return {
        "name": _clean_text(row.get("사업명")),
        "category": " > ".join(
            value
            for value in [
                _clean_text(row.get("사업대분류명")),
                _clean_text(row.get("사업중분류명")),
                _clean_text(row.get("사업소분류명")),
            ]
            if value
        ),
        "description": _clean_text(row.get("사업내용")),
        "target": _clean_text(row.get("이용대상내용")),
        "method": _clean_text(row.get("이용방법내용")),
        "contact": _clean_text(row.get("문의처내용")),
        "regions": _clean_text(row.get("대상지역")),
        "target_age": _clean_text(row.get("대상아동나이")),
        "interests": _clean_text(row.get("대상관심")),
        "detail_url": _clean_url(row.get("자세히보기사이트주소")),
        "apply_url": _clean_url(row.get("신청하기사이트주소")),
    }


def _empty_response(message: str) -> dict:
    return {
        "source": SEOUL_SUPPORT_SOURCE,
        "service_name": "LOCAL_CSV",
        "is_seoul_only": True,
        "items": [],
        "message": message,
    }


def _resolve_local_csv_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "raw" / LOCAL_SUPPORT_CSV


def get_seoul_pregnancy_supports(limit: int = 12, stage: str = "pregnancy") -> dict:
    csv_path = _resolve_local_csv_path()
    if not csv_path.exists():
        return _empty_response(
            f"로컬 CSV 파일을 찾을 수 없습니다: {csv_path}. 파일을 backend/data/raw/{LOCAL_SUPPORT_CSV}로 이동해 주세요."
        )

    try:
        with csv_path.open("r", encoding="cp949", errors="replace") as csvfile:
            reader = csv.DictReader(csvfile)
            rows = [row for row in reader if any(row.values())]
    except OSError as exc:
        return _empty_response(f"서울시 지원사업 CSV를 읽을 수 없습니다: {exc}")

    filtered_rows = [
        row
        for row in rows
        if _contains_pregnancy_keyword(row) and _matches_support_stage(row, stage)
    ]
    filtered_rows = sorted(filtered_rows, key=lambda row: _stage_sort_key(row, stage))
    items = [_normalize_support(row) for row in filtered_rows]
    total_count = len(items)

    return {
        "source": SEOUL_SUPPORT_SOURCE,
        "service_name": "LOCAL_CSV",
        "is_seoul_only": True,
        "stage": stage,
        "total_count": total_count,
        "items": items[:limit],
        "message": SEOUL_ONLY_MESSAGE,
    }
