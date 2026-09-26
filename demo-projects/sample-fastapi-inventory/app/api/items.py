from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.queries import get_low_stock_items, get_warehouse_stock_report

router = APIRouter(prefix="/api/items", tags=["items"])

@router.get("/low-stock")
def low_stock(
    threshold: int  = Query(10, ge=1, le=100),
    db: Session     = Depends(get_db),
):
    """
    Returns items below stock threshold.
    WARNING: full table scan — no index on stock_levels.item_id or updated_at
    """
    return get_low_stock_items(db, threshold=threshold)

@router.get("/warehouse/{warehouse_id}/report")
def warehouse_report(warehouse_id: int, db: Session = Depends(get_db)):
    """
    Stock report for a warehouse.
    WARNING: sequential scan on stock_levels — no index on warehouse_id FK
    """
    return get_warehouse_stock_report(db, warehouse_id=warehouse_id)
