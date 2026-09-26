from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database_base import Base

class Order(Base):
    __tablename__ = "orders"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    total      = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    user       = relationship("User", back_populates="orders")
    items      = relationship("OrderItem", back_populates="order")
