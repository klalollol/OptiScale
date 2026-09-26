from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database_base import Base

class User(Base):
    __tablename__ = "users"
    id       = Column(Integer, primary_key=True, index=True)
    email    = Column(String, unique=True, index=True)
    username = Column(String, index=True)
    orders   = relationship("Order", back_populates="user", lazy="select")
