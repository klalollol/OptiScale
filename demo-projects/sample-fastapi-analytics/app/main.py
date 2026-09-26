from fastapi import FastAPI
from app.endpoints import reports, metrics

app = FastAPI(title="Analytics Dashboard API", version="0.9.0")
app.include_router(reports.router)
app.include_router(metrics.router)
