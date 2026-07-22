from pathlib import Path
import sys
import pandas as pd

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
sys.path.append(str(BACKEND_DIR))

from app.database import SessionLocal, engine, Base
from app.models import (
    AgeCauseStat,
    AnnualInfertilityTreatmentStat,
    AttemptStat,
    FertilityPlace,
    InstitutionStat,
    ProcessStat,
)

Base.metadata.create_all(bind=engine)
RAW_DIR = BACKEND_DIR / "data" / "raw"


def read_csv_flexible(csv_path: Path) -> pd.DataFrame:
    for encoding in ["utf-8-sig", "cp949"]:
        try:
            return pd.read_csv(csv_path, encoding=encoding)
        except UnicodeDecodeError:
            continue

    return pd.read_excel(csv_path)


def safe_int(value):
    if pd.isna(value) or value == "":
        return 0
    try:
        return int(float(str(value).replace(",", "").strip()))
    except ValueError:
        return 0


def safe_str(value):
    if pd.isna(value):
        return None
    return str(value).strip()


def normalize_age_group(value):
    if pd.isna(value):
        return None
    text = str(value).strip().replace("-", "~")
    text = text.replace("25세미만", "25세 미만")
    text = text.replace("45세이상", "45세 이상")
    return text


def resolve_data_file(file_name: str) -> Path:
    path = RAW_DIR / file_name
    if path.exists():
        return path

    matches = sorted(RAW_DIR.glob(f"{Path(file_name).stem}*"))
    if matches:
        return matches[0]

    return path


def pick(row, candidates, default=None):
    for col in candidates:
        if col in row.index:
            return row.get(col)
    return default


def import_age_cause(db, csv_path: Path):
    if not csv_path.exists():
        print(f"SKIP: {csv_path} not found")
        return

    db.query(AgeCauseStat).delete()
    df = read_csv_flexible(csv_path)

    for _, row in df.iterrows():
        item = AgeCauseStat(
            year=safe_int(pick(row, ["기준년도", "년도", "연도", "진료년도"])),
            treatment_type=pick(row, ["시술유형별", "시술유형", "난임시술유형"]),
            age_group=normalize_age_group(pick(row, ["연령구분", "연령대", "연령"])),
            total_count=safe_int(pick(row, ["계", "전체", "전체건수", "난임시술건수", "전체 난임시술건수"])),
            male_factor_count=safe_int(pick(row, ["남성요인", "난임원인건수_남성요인"])),
            ovulation_disorder_count=safe_int(pick(row, ["배란기능장애", "난임원인건수_배란기능장애"])),
            ovarian_decline_count=safe_int(pick(row, ["난소기능저하", "난임원인건수_난소기능저하"])),
            tubal_factor_count=safe_int(pick(row, ["난관요인", "난임원인건수_난관요인"])),
            uterine_factor_count=safe_int(pick(row, ["자궁요인", "난임원인건수_자궁요인"])),
            endometriosis_count=safe_int(pick(row, ["자궁내막증", "난임원인건수_자궁내막증"])),
            unexplained_count=safe_int(pick(row, ["원인불명", "난임원인건수_원인불명"])),
            other_count=safe_int(pick(row, ["기타요인", "기타", "난임원인건수_기타요인"])),
            complex_count=safe_int(pick(row, ["복합요인", "난임원인건수_복합요인"])),
        )
        db.add(item)

    db.commit()
    print(f"Imported age cause stats: {len(df)} rows")


def import_process(db, csv_path: Path):
    if not csv_path.exists():
        print(f"SKIP: {csv_path} not found")
        return

    db.query(ProcessStat).delete()
    df = read_csv_flexible(csv_path)

    for _, row in df.iterrows():
        item = ProcessStat(
            year=safe_int(pick(row, ["기준년도", "년도", "연도", "진료년도"])),
            treatment_type=pick(row, ["시술유형별", "시술유형", "난임시술유형"]),
            age_group=normalize_age_group(pick(row, ["연령구분", "연령대", "연령"])),
            ovulation_induction_count=safe_int(pick(row, ["배란유도건수", "배란유도"])),
            sperm_retrieval_count=safe_int(pick(row, ["정자획득건수", "정자획득"])),
            egg_retrieval_count=safe_int(pick(row, ["난자채취건수", "난자채취"])),
            fertilization_count=safe_int(pick(row, ["배아수정건수", "배아수정"])),
            completed_count=safe_int(pick(row, ["시술완료건수", "시술완료", "완료건수"])),
        )
        db.add(item)

    db.commit()
    print(f"Imported process stats: {len(df)} rows")


def import_attempt(db, csv_path: Path):
    if not csv_path.exists():
        print(f"SKIP: {csv_path} not found")
        return

    db.query(AttemptStat).delete()
    df = read_csv_flexible(csv_path)
    imported_count = 0

    treatment_columns = [
        ("전체", "전체 난임시술건수"),
        ("인공수정", "인공수정시술건수"),
        ("체외수정", "체외수정시술건수"),
    ]

    for _, row in df.iterrows():
        year = safe_int(pick(row, ["기준년도", "년도", "연도", "진료년도"]))
        attempt_round = pick(row, ["시술횟수", "시술차수", "차수"])

        if any(column in row.index for _, column in treatment_columns):
            for treatment_type, column in treatment_columns:
                db.add(
                    AttemptStat(
                        year=year,
                        treatment_type=treatment_type,
                        attempt_round=attempt_round,
                        total_count=safe_int(pick(row, [column])),
                    )
                )
                imported_count += 1
        else:
            db.add(
                AttemptStat(
                    year=year,
                    treatment_type=pick(row, ["시술유형별", "시술유형", "난임시술유형"]),
                    attempt_round=attempt_round,
                    total_count=safe_int(pick(row, ["계", "전체", "시술건수", "전체건수"])),
                )
            )
            imported_count += 1

    db.commit()
    print(f"Imported attempt stats: {imported_count} rows")


def import_institution(db, csv_path: Path):
    if not csv_path.exists():
        print(f"SKIP: {csv_path} not found")
        return

    db.query(InstitutionStat).delete()
    try:
        df = read_csv_flexible(csv_path)
    except Exception as exc:
        print(f"SKIP: {csv_path} could not be read ({exc})")
        db.commit()
        return

    for _, row in df.iterrows():
        item = InstitutionStat(
            year=safe_int(pick(row, ["기준년도", "년도", "연도", "진료년도"])),
            treatment_type=pick(row, ["시술유형별", "시술유형", "난임시술유형"]),
            institution_type=pick(row, ["의료기관종별", "종별", "요양기관종별"]),
            institution_count=safe_int(pick(row, ["의료기관수", "기관수"])),
            treatment_count=safe_int(pick(row, ["시술건수", "계", "전체건수"])),
        )
        db.add(item)

    db.commit()
    print(f"Imported institution stats: {len(df)} rows")


def import_places(db, csv_path: Path):
    if not csv_path.exists():
        print(f"SKIP: {csv_path} not found")
        return

    db.query(FertilityPlace).delete()
    df = read_csv_flexible(csv_path)

    for _, row in df.iterrows():
        db.add(
            FertilityPlace(
                sequence=safe_int(pick(row, ["연번"])),
                region=safe_str(pick(row, ["지역"])),
                institution_name=safe_str(pick(row, ["요양기관명칭", "기관명", "요양기관명"])),
                institution_type=safe_str(pick(row, ["종별", "의료기관종별", "요양기관종별"])),
                address=safe_str(pick(row, ["주소"])),
                phone=safe_str(pick(row, ["전화번호", "대표전화"])),
            )
        )

    db.commit()
    print(f"Imported fertility places: {len(df)} rows")


def import_annual_treatment(db, csv_path: Path):
    if not csv_path.exists():
        print(f"SKIP: {csv_path} not found")
        return

    db.query(AnnualInfertilityTreatmentStat).delete()
    df = read_csv_flexible(csv_path)

    for _, row in df.iterrows():
        year_text = safe_str(pick(row, ["진료년도", "년도", "연도"]))
        db.add(
            AnnualInfertilityTreatmentStat(
                year=safe_int(str(year_text).replace("년", "") if year_text else None),
                patient_count=safe_int(pick(row, ["진료인원(명)", "진료인원"])),
                treatment_count=safe_int(pick(row, ["진료건수(건)", "진료건수"])),
                treatments_per_person=safe_str(pick(row, ["1인당건수(건)", "1인당건수"])),
            )
        )

    db.commit()
    print(f"Imported annual treatment stats: {len(df)} rows")


if __name__ == "__main__":
    db = SessionLocal()

    import_age_cause(db, resolve_data_file("age_cause.csv"))
    import_process(db, resolve_data_file("process.csv"))
    import_attempt(db, resolve_data_file("attempt.csv"))
    import_institution(db, resolve_data_file("institution.csv"))
    import_places(db, resolve_data_file("places.csv"))
    import_annual_treatment(db, resolve_data_file("ing.csv"))

    db.close()
    print("HIRA data import completed.")
