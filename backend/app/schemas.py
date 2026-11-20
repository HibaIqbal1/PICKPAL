from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    id: str  # Firebase Auth UID

class UserResponse(UserBase):
    id: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    store_name: str
    category: str
    budget_cap: float

class OrderCreate(OrderBase):
    id: str
    customer_id: str

class OrderResponse(OrderBase):
    id: str
    customer_id: str
    worker_id: Optional[str] = None
    status: str
    total_amount: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Location Schemas
class LocationUpdate(BaseModel):
    worker_id: str
    order_id: str
    latitude: float
    longitude: float

class LocationResponse(LocationUpdate):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True
