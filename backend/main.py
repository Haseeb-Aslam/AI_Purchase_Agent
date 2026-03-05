"""AI Purchase Agent & Procurement Analytics - FastAPI backend."""
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import connect_db, close_db
from routes import data_import, analytics, ai_agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AI Purchase Agent & Procurement Analytics API",
    description="Backend for AI-driven procurement, vendor comparison, reorder alerts, and analytics dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data_import.router)
app.include_router(analytics.router)
app.include_router(ai_agent.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve built frontend (Docker); API root when not
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    @app.get("/")
    async def root():
        return {"message": "AI Purchase Agent API", "docs": "/docs"}
