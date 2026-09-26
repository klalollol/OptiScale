from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.models import Item, StockLevel, Warehouse
import datetime

# =============================================================================
# BOTTLENECK: MISSING INDEX — FULL TABLE SCAN ON STOCK LEVELS
# =============================================================================
# The `stock_levels` table has no index on `item_id` (foreign key) or `updated_at`.
# Every call to get_low_stock_items() scans the entire stock_levels table.
#
# With 200,000 stock records:
#   Seq Scan on stock_levels (cost=0.00..6420.00 rows=1240 width=48)
#   Filter: (quantity < threshold AND updated_at > cutoff)
#   Rows Removed by Filter: 198760
#   Buffers: shared hit=420000
#
# Result: 1,640 ms average query time per request.
# =============================================================================

def get_low_stock_items(db: Session, threshold: int = 10):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=30)

    # Full table scan — no index on item_id or updated_at
    stocks = db.query(StockLevel).filter(
        StockLevel.quantity < threshold,
        StockLevel.updated_at >= cutoff,
    ).order_by(StockLevel.updated_at.desc()).all()

    return stocks


def get_warehouse_stock_report(db: Session, warehouse_id: int):
    # Sequential scan on stock_levels — no index on warehouse_id FK
    raw = db.execute(text("""
        SELECT i.id, i.sku, i.name, sl.quantity, sl.updated_at
        FROM items i
        LEFT JOIN stock_levels sl ON sl.item_id = i.id
        WHERE sl.warehouse_id = :wid
        ORDER BY sl.updated_at DESC
        LIMIT 100
    """), {"wid": warehouse_id})
    return [dict(row._mapping) for row in raw]

# -----------------------------------------------------------------------------
# OPTIMIZED VERSION (applied by OptiScale):
# -----------------------------------------------------------------------------
# Migration:
#   op.create_index("ix_stock_levels_item_id", "stock_levels", ["item_id"])
#   op.create_index("ix_stock_levels_warehouse_updated",
#                   "stock_levels", ["warehouse_id", "updated_at"])
#
# After index:
#   Index Scan using ix_stock_levels_warehouse_updated
#   Query time: ~95 ms  (was 1,640 ms)
# -----------------------------------------------------------------------------
