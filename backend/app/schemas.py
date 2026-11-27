import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .models import UserRole, ShippingTier, OrderStatus, EscrowStatus, KYCStatus


# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    id: str  # Firebase UID


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- KYC Schemas ---
class KYCCreate(BaseModel):
    document_type: str
    document_number: str
    document_url: str


class KYCResponse(BaseModel):
    id: str
    worker_id: str
    document_type: str
    document_number: str
    document_url: str
    status: KYCStatus
    submitted_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Order Schemas ---
class OrderCreate(BaseModel):
    store_name: str
    category: str
    items_description: str
    shipping_tier: ShippingTier = ShippingTier.LOCAL
    budget_cap: float = Field(..., gt=0)
    delivery_fee: float = Field(..., gt=0)


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    worker_id: Optional[str]
    store_name: str
    category: str
    items_description: str
    shipping_tier: ShippingTier
    budget_cap: float
    actual_item_cost: float
    delivery_fee: float
    service_fee: float
    total_amount: float
    status: OrderStatus
    delivery_otp: Optional[str] = None
    store_receipt_url: Optional[str]
    replacement_notes: Optional[str]
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True


# --- Escrow Schemas ---
class EscrowResponse(BaseModel):
    id: str
    order_id: str
    customer_id: str
    worker_id: Optional[str]
    amount_held: float
    amount_released: float
    amount_refunded: float
    status: EscrowStatus
    created_at: datetime.datetime
    released_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True


# --- Location Schemas ---
class LocationPayload(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class LocationResponse(BaseModel):
    id: str
    order_id: str
    worker_id: str
    latitude: float
    longitude: float
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True