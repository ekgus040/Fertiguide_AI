# FertiGuide AI (난임길잡이 AI)

난임·임신 준비 과정을 돕는 **AI 상담 및 정보 안내 서비스**입니다.
공공 통계(HIRA, 서울열린데이터광장)와 LLM 기반 상담을 결합해, 병원 방문 전 확인할 내용부터 지역 지원사업·기관 찾기까지 한 곳에서 안내합니다.

> 보건의료 AI 활용 공모전 출품 프로젝트

---

## 주요 기능

- **난임 시술 상담 준비** — HIRA 통계(연령별 원인, 시술 과정·횟수, 지정기관, 연간 추이)를 시각화하고, 병원 방문 전 확인할 상담 질문과 안전 체크리스트를 정리합니다.
- **AI 상담 챗봇** — 사용자 프로필을 바탕으로 난임·임신 관련 질문에 답하는 LLM 기반 상담 챗봇입니다.
- **임신 가능성·응급피임 안내** — 관계 후 경과 시간과 피임 상황을 바탕으로 상담 흐름과 외부 안내 자료를 정리합니다.
- **서울 임신·출산 지원사업 안내** — 서울열린데이터광장 데이터로 임신 후 확인할 수 있는 서울시 지원사업을 보여줍니다.
- **병원·약국 찾기** — 난임시술 지정기관, 산부인과, 야간/휴일진료, 약국 확인 경로를 안내합니다.
- **상담 리포트 생성** — 상담 내용을 정리한 리포트를 생성합니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, Pydantic, Pandas |
| AI | OpenAI API |
| Database | SQLite |
| Data | HIRA 통계, 서울열린데이터광장 |

---

## 프로젝트 구조

```
fertiguide-ai/
├── backend/                # FastAPI 서버
│   ├── app/
│   │   ├── main.py         # 앱 진입점 / 라우터 등록
│   │   ├── routers/        # stats, chat, report, pregnancy, support
│   │   ├── services/       # 챗봇, RAG, 서울 지원사업, 통계 로직
│   │   ├── prompts/        # 상담 프롬프트
│   │   ├── models.py       # DB 모델
│   │   └── schemas.py      # Pydantic 스키마
│   ├── data/raw/           # 원천 CSV 데이터
│   ├── scripts/            # HIRA 데이터 임포트 스크립트
│   └── requirements.txt
└── frontend/               # Next.js 앱
    ├── app/                # 페이지 / 레이아웃
    ├── components/         # UI 컴포넌트
    └── lib/api.ts          # 백엔드 API 연동
```

---

## 시작하기

### 1. 백엔드

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # 환경 변수 설정
uvicorn app.main:app --reload   # http://localhost:8000
```

`.env` 예시:

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
DATABASE_URL=sqlite:///./fertiguide.db
SEOUL_OPEN_DATA_API_KEY=your_seoul_open_data_api_key_here
```

### 2. 프론트엔드

```bash
cd frontend
npm install

cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL 설정
npm run dev                         # http://localhost:3000
```

---

## API 개요

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET`  | `/stats/*` | HIRA 통계 (연령별 원인, 과정, 횟수, 지정기관, 장소, 연간 추이) |
| `POST` | `/chat` | AI 상담 챗봇 |
| `POST` | `/report` | 상담 리포트 생성 |
| `POST` | `/pregnancy/possibility` | 임신 가능성 상담 |
| `GET`  | `/support/seoul-pregnancy` | 서울 임신·출산 지원사업 |

전체 API 문서는 서버 실행 후 `http://localhost:8000/docs` 에서 확인할 수 있습니다.

---

## 데이터 출처

- 건강보험심사평가원(HIRA) 난임 시술 통계
- 서울열린데이터광장 임신·출산 지원사업 데이터

---

## 면책 조항

본 서비스는 정보 제공 및 상담 보조를 목적으로 하며, **전문 의료진의 진단이나 처방을 대체하지 않습니다.** 실제 진료·복약 결정은 반드시 의료 전문가와 상의하시기 바랍니다.
