from sqlalchemy import Column, Integer, String
from .database import Base


class AgeCauseStat(Base):
    __tablename__ = "infertility_age_cause_stats"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer)
    treatment_type = Column(String)
    age_group = Column(String)
    total_count = Column(Integer)
    male_factor_count = Column(Integer)
    ovulation_disorder_count = Column(Integer)
    ovarian_decline_count = Column(Integer)
    tubal_factor_count = Column(Integer)
    uterine_factor_count = Column(Integer)
    endometriosis_count = Column(Integer)
    unexplained_count = Column(Integer)
    other_count = Column(Integer)
    complex_count = Column(Integer)


class ProcessStat(Base):
    __tablename__ = "infertility_process_stats"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer)
    treatment_type = Column(String)
    age_group = Column(String)
    ovulation_induction_count = Column(Integer)
    sperm_retrieval_count = Column(Integer)
    egg_retrieval_count = Column(Integer)
    fertilization_count = Column(Integer)
    completed_count = Column(Integer)


class AttemptStat(Base):
    __tablename__ = "infertility_attempt_stats"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer)
    treatment_type = Column(String)
    attempt_round = Column(String)
    total_count = Column(Integer)


class InstitutionStat(Base):
    __tablename__ = "infertility_institution_stats"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer)
    treatment_type = Column(String)
    institution_type = Column(String)
    institution_count = Column(Integer)
    treatment_count = Column(Integer)


class FertilityPlace(Base):
    __tablename__ = "fertility_places"

    id = Column(Integer, primary_key=True, index=True)
    sequence = Column(Integer)
    region = Column(String)
    institution_name = Column(String)
    institution_type = Column(String)
    address = Column(String)
    phone = Column(String)


class AnnualInfertilityTreatmentStat(Base):
    __tablename__ = "annual_infertility_treatment_stats"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer)
    patient_count = Column(Integer)
    treatment_count = Column(Integer)
    treatments_per_person = Column(String)
