from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import stats, chat, report, pregnancy, support

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FertiGuide AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stats.router)
app.include_router(chat.router)
app.include_router(report.router)
app.include_router(pregnancy.router)
app.include_router(support.router)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "FertiGuide AI",
        "message": "난임길잡이 AI API is running."
    }
