from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.storage.database import get_db
from app.storage.queries import load_dashboard_reports, get_report_by_id

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/dashboard")
def dashboard_reports(
    user_id: int    = Query(..., description="User ID"),
    limit: int      = Query(20, ge=1, le=100),
    db: Session     = Depends(get_db),
):
    """
    Optimized dashboard — batch-loaded relationships, 2 queries total.
    No N+1. Indexed filter columns.
    """
    return load_dashboard_reports(db, user_id=user_id, limit=limit)

@router.get("/{report_id}")
def get_report(
    report_id: int,
    user_id: int = Query(...),
    db: Session  = Depends(get_db),
):
    report = get_report_by_id(db, report_id=report_id, user_id=user_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
