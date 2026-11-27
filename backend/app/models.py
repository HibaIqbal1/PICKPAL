import datetime
import enum
from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship
from .database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    WORKER = "worker"
    ADMIN = "admin"


class ShippingTier(str, enum.Enum):
    LOCAL = "LOCAL"
    STATE = "STATE"
    GLOBAL = "GLOBAL"


class OrderStatus(str, enum.Enum):
    SEARCHING_WORKER = "searching_worker"
    ASSIGNED = "assigned"
    PURCHASING = "purchasing"
    OUT_OF_STOCK = "out_of_stock"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class EscrowStatus(str, enum.Enum):
    HELD = "HELD"
    RELEASED = "RELEASED"
    REFUNDED = "REFUNDED"
    DISPUTED = "DISPUTED"


class KYCStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # Firebase UID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    orders_placed = relationship(
        "Order", back_populates="customer", foreign_keys="[Order.customer_id]"
    )
    orders_assigned = relationship(
        "Order", back_populates="worker", foreign_keys="[Order.worker_id]"
    )
    kyc_record = relationship("WorkerKYC", back_populates="worker", uselist=False)


class WorkerKYC(Base):
    __tablename__ = "worker_kyc"

    id = Column(String, primary_key=True, index=True)
    worker_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    document_type = Column(String, nullable=False)  # e.g., "PAN", "DRIVING_LICENSE"
    document_number = Column(String, nullable=False)
    document_url = Column(String, nullable=False)
    status = Column(SQLEnum(KYCStatus), default=KYCStatus.PENDING, nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    worker = relationship("User", back_populates="kyc_record")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    worker_id = Column(String, ForeignKey("users.id"), nullable=True)

    store_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    items_description = Column(Text, nullable=False)
    shipping_tier = Column(
        SQLEnum(ShippingTier), default=ShippingTier.LOCAL, nullable=False
    )

    budget_cap = Column(Float, nullable=False)
    actual_item_cost = Column(Float, default=0.0)
    delivery_fee = Column(Float, nullable=False)
    service_fee = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    delivery_otp = Column(String(4), nullable=False)
    store_receipt_url = Column(String, nullable=True)
    replacement_notes = Column(Text, nullable=True)

    status = Column(
        SQLEnum(OrderStatus), default=OrderStatus.SEARCHING_WORKER, nullable=False
    )
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship(
        "User", back_populates="orders_placed", foreign_keys=[customer_id]
    )
    worker = relationship(
        "User", back_populates="orders_assigned", foreign_keys=[worker_id]
    )
    escrow = relationship("EscrowTransaction", back_populates="order", uselist=False)
    tracking_logs = relationship(
        "LocationLog", back_populates="order", cascade="all, delete-orphan"
    )


class EscrowTransaction(Base):
    __tablename__ = "escrow_transactions"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(
        String, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    customer_id = Column(String, ForeignKey("users.id"), nullable=False)
    worker_id = Column(String, ForeignKey("users.id"), nullable=True)

    amount_held = Column(Float, nullable=False)
    amount_released = Column(Float, default=0.0)
    amount_refunded = Column(Float, default=0.0)

    status = Column(SQLEnum(EscrowStatus), default=EscrowStatus.HELD, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    released_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="escrow")


class LocationLog(Base):
    __tablename__ = "location_logs"

    id = Column(String, primary_key=True, index=True)
    order_id = Column(
        String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    worker_id = Column(String, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="tracking_logs")