from sqlalchemy.orm import Session, joinedload, selectinload
from app.storage.models import Report, ReportRow, Dashboard

# =============================================================================
# OPTIMIZED: batch-loaded relationships — no N+1
# =============================================================================
# Uses selectinload for report rows (1 extra query total, not N queries).
# Uses joinedload for dashboard (single JOIN).
# All filter columns have composite indexes.
# Pagination prevents unbounded result sets.
# =============================================================================

def load_dashboard_reports(db: Session, user_id: int, limit: int = 20):
    """
    Load dashboard reports with all rows in 2 queries total.
    Query 1: reports + dashboard JOIN (joinedload)
    Query 2: all rows for all reports batch-loaded (selectinload)
    """
    return (
        db.query(Report)
        .filter(
            Report.owner_id == user_id,
            Report.visible == True,
        )
        .options(
            joinedload(Report.dashboard),       # JOIN — not a separate query
            selectinload(Report.rows),          # 1 batch query for all rows
        )
        .order_by(Report.created_at.desc())
        .limit(limit)
        .all()
    )


def get_report_by_id(db: Session, report_id: int, user_id: int):
    """Single report lookup — index scan on report_id (PK)."""
    return (
        db.query(Report)
        .filter(Report.id == report_id, Report.owner_id == user_id)
        .options(
            joinedload(Report.dashboard),
            selectinload(Report.rows),
        )
        .first()
    )
