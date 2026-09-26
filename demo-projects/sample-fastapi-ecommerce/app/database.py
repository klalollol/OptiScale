from sqlalchemy.orm import Session
from app.models import User, Order

# 컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴
# BOTTLENECK: N+1 Database Query Pattern
# Each call to get_orders() issues a separate SQL SELECT per user.
# Under load (1,000+ users) this generates 1,000+ round-trips.
# 컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴
def get_users_with_orders(db: Session):
    users = db.query(User).all()               # 1 query

    for user in users:
        user.orders = db.query(Order).filter(  # +1 query PER user
            Order.user_id == user.id
        ).all()

    return users

# Optimized version (applied by OptiScale):
# def get_users_with_orders(db: Session):
#     return db.query(User).options(
#         joinedload(User.orders)              # single JOIN query
#     ).all()
