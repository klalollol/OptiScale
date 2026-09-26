from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship, DeclarativeBase
import datetime

class Base(DeclarativeBase):
    pass

class Dashboard(Base):
    __tablename__ = "dashboards"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(120), nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    reports  = relationship("Report", back_populates="dashboard")

class Report(Base):
    __tablename__ = "reports"
    id         = Column(Integer, primary_key=True, index=True)
    owner_id   = Column(Integer, nullable=False, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"), nullable=False, index=True)
    title      = Column(String(200), nullable=False)
    visible    = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    dashboard  = relationship("Dashboard", back_populates="reports")
    rows       = relationship("ReportRow", back_populates="report", lazy="selectin")

    # Composite index on the most common filter pattern
    __table_args__ = (
        Index("ix_reports_owner_visible", "owner_id", "visible"),
    )

class ReportRow(Base):
    __tablename__ = "report_rows"
    id         = Column(Integer, primary_key=True, index=True)
    report_id  = Column(Integer, ForeignKey("reports.id"), nullable=False, index=True)
    metric     = Column(String(80), nullable=False)
    value      = Column(String(200), nullable=False)
    timestamp  = Column(DateTime, default=datetime.datetime.utcnow)
    report     = relationship("Report", back_populates="rows")

    __table_args__ = (
        Index("ix_report_rows_report_timestamp", "report_id", "timestamp"),
    )
