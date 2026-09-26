from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, get_users_with_orders

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("/users-with-orders")
def users_with_orders(db: Session = Depends(get_db)):
    # This endpoint triggers the N+1 bottleneck
    return get_users_with_orders(db)
