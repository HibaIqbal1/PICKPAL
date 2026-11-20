import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)  # Firebase UID as primary key
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    role = Column(String, nullable=False)              # customer, worker, admin
    status = Column(String, default="active")          # active, suspended, banned
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    worker_id = Column(String, ForeignKey("users.id"), nullable=True)
    store_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="searching_worker")  # status workflow
    budget_cap = Column(Float, nullable=False)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    customer = relationship("User", foreign_keys=[customer_id])
    worker = relationship("User", foreign_keys=[worker_id])

class LocationLog(Base):
    __tablename__ = "location_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    worker_id = Column(String, ForeignKey("users.id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    worker = relationship("User")
    order = relationship("Order")
