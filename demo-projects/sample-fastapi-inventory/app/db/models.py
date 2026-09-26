from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase
import datetime

class Base(DeclarativeBase):
    pass

class Warehouse(Base):
    __tablename__ = "warehouses"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(120), nullable=False)
    location = Column(String(200), nullable=True)
    stocks   = relationship("StockLevel", back_populates="warehouse")

class Item(Base):
    __tablename__ = "items"
    id     = Column(Integer, primary_key=True, index=True)
    sku    = Column(String(50), unique=True, nullable=False, index=True)
    name   = Column(String(200), nullable=False)
    active = Column(Boolean, default=True)
    stocks = relationship("StockLevel", back_populates="item")

class StockLevel(Base):
    __tablename__ = "stock_levels"
    id           = Column(Integer, primary_key=True, index=True)
    item_id      = Column(Integer, ForeignKey("items.id"), nullable=False)       # NO INDEX
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)  # NO INDEX
    quantity     = Column(Integer, nullable=False, default=0)
    updated_at   = Column(DateTime, default=datetime.datetime.utcnow)            # NO INDEX
    item         = relationship("Item", back_populates="stocks")
    warehouse    = relationship("Warehouse", back_populates="stocks")
