import datetime
import os
import random
import secrets
import shutil
import uuid
from typing import List, Optional

import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status,
)
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal, get_db
from . import models, schemas
from .websocket import ConnectionManager

# Initialize Firebase Admin SDK
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

security = HTTPBearer(auto_error=False)


# --- Authentication Dependencies ---
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials if credentials else None
    if token:
        # 1. Direct ID lookup (e.g., CUST_001, WORKER_001, or existing user ID)
        direct_user = db.query(models.User).filter(models.User.id == token).first()
        if direct_user:
            return direct_user

        # 2. Try Firebase ID token verification
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            user_id = decoded_token.get("uid")
            db_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not db_user:
                db_user = models.User(
                    id=user_id,
                    email=decoded_token.get("email", f"{user_id}@pickpal.app"),
                    name=decoded_token.get("name", "PickPal User"),
                    role=models.UserRole.CUSTOMER,
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
            return db_user
        except Exception:
            # Fallback for dev aliases
            if "worker" in token.lower():
                w = db.query(models.User).filter(models.User.id == "WORKER_001").first()
                if w:
                    return w
            if "cust" in token.lower():
                c = db.query(models.User).filter(models.User.id == "CUST_001").first()
                if c:
                    return c

    # Fallback to CUST_001 during local development / testing if no credentials provided
    default_cust = db.query(models.User).filter(models.User.id == "CUST_001").first()
    if default_cust:
        return default_cust

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or Invalid Authorization Header",
    )


def require_role(required_role: models.UserRole):
    def role_checker(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db),
    ) -> models.User:
        token = credentials.credentials if credentials else None
        if token:
            user = db.query(models.User).filter(models.User.id == token).first()
            if user and (user.role == required_role or user.role == models.UserRole.ADMIN):
                return user

        if required_role == models.UserRole.WORKER:
            if not token or "worker" in token.lower():
                w = db.query(models.User).filter(models.User.id == "WORKER_001").first()
                if w:
                    return w

        current_user = get_current_user(credentials, db)
        if (
            current_user.role != required_role
            and current_user.role != models.UserRole.ADMIN
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {required_role.value} role",
            )
        return current_user

    return role_checker


app = FastAPI(
    title="PickPal Core Logistics & Escrow API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()
UPLOAD_DIR = os.path.abspath("uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "receipts"), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, "kyc"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        cust = db.query(models.User).filter(models.User.id == "CUST_001").first()
        if not cust:
            cust = models.User(
                id="CUST_001",
                email="customer@pickpal.app",
                name="Customer Demo",
                phone="9876543210",
                role=models.UserRole.CUSTOMER,
            )
            db.add(cust)
            db.commit()

        worker = db.query(models.User).filter(models.User.id == "WORKER_001").first()
        if not worker:
            worker = models.User(
                id="WORKER_001",
                email="worker@pickpal.app",
                name="Worker Rajesh",
                phone="9876500000",
                role=models.UserRole.WORKER,
            )
            db.add(worker)
            db.commit()

        kyc = db.query(models.WorkerKYC).filter(models.WorkerKYC.worker_id == "WORKER_001").first()
        if not kyc:
            kyc = models.WorkerKYC(
                id="KYC_DEMO_001",
                worker_id="WORKER_001",
                document_type="PAN",
                document_number="ABCDE1234F",
                document_url="/uploads/kyc/demo_pan.jpg",
                status=models.KYCStatus.APPROVED,
            )
            db.add(kyc)
            db.commit()
    except Exception as e:
        print(f"Startup DB init warning: {e}")
    finally:
        db.close()


@app.get("/health", tags=["System"])
def health_check():
    return {
        "service": "PickPal Backend",
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }


# ============================================================================
# USER & KYC MANAGEMENT
# ============================================================================


@app.post(
    "/api/users/register", response_model=schemas.UserResponse, tags=["Users"]
)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.id == user.id).first()
    if existing:
        return existing
    new_user = models.User(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.get("/api/users/me", response_model=schemas.UserResponse, tags=["Users"])
def get_current_user_profile(
    current_user: models.User = Depends(get_current_user),
):
    return current_user


@app.post("/api/kyc/submit", response_model=schemas.KYCResponse, tags=["KYC"])
def submit_kyc(
    kyc_data: schemas.KYCCreate,
    current_user: models.User = Depends(require_role(models.UserRole.WORKER)),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.WorkerKYC)
        .filter(models.WorkerKYC.worker_id == current_user.id)
        .first()
    )
    if existing:
        existing.document_type = kyc_data.document_type
        existing.document_number = kyc_data.document_number
        existing.document_url = kyc_data.document_url
        existing.status = models.KYCStatus.PENDING
        db.commit()
        db.refresh(existing)
        return existing

    kyc_record = models.WorkerKYC(
        id=f"KYC_{secrets.token_hex(6).upper()}",
        worker_id=current_user.id,
        document_type=kyc_data.document_type,
        document_number=kyc_data.document_number,
        document_url=kyc_data.document_url,
        status=models.KYCStatus.PENDING,
    )
    db.add(kyc_record)
    db.commit()
    db.refresh(kyc_record)
    return kyc_record


# ============================================================================
# ORDER & ESCROW LIFECYCLE
# ============================================================================


@app.post(
    "/api/orders", response_model=schemas.OrderResponse, tags=["Orders & Escrow"]
)
def create_order(
    payload: schemas.OrderCreate,
    current_user: models.User = Depends(require_role(models.UserRole.CUSTOMER)),
    db: Session = Depends(get_db),
):
    # Platform service fee: 5% of delivery fee
    service_fee = round(payload.delivery_fee * 0.05, 2)
    total_amount = round(
        payload.budget_cap + payload.delivery_fee + service_fee, 2
    )
    delivery_otp = f"{random.randint(1000, 9999)}"
    order_id = f"ORD_{datetime.datetime.utcnow().strftime('%y%m%d')}_{secrets.token_hex(4).upper()}"

    # Atomic write: Order + Escrow Held
    new_order = models.Order(
        id=order_id,
        customer_id=current_user.id,
        store_name=payload.store_name,
        category=payload.category,
        items_description=payload.items_description,
        shipping_tier=payload.shipping_tier,
        budget_cap=payload.budget_cap,
        delivery_fee=payload.delivery_fee,
        service_fee=service_fee,
        total_amount=total_amount,
        delivery_otp=delivery_otp,
        status=models.OrderStatus.SEARCHING_WORKER,
    )
    db.add(new_order)

    new_escrow = models.EscrowTransaction(
        id=f"ESC_{secrets.token_hex(6).upper()}",
        order_id=order_id,
        customer_id=current_user.id,
        amount_held=total_amount,
        status=models.EscrowStatus.HELD,
    )
    db.add(new_escrow)

    db.commit()
    db.refresh(new_order)
    return new_order


@app.get(
    "/api/orders",
    response_model=List[schemas.OrderResponse],
    tags=["Orders & Escrow"],
)
def list_orders(
    status_filter: Optional[models.OrderStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Order)
    if status_filter == models.OrderStatus.SEARCHING_WORKER:
        # Open job board queries unassigned orders
        query = query.filter(models.Order.status == models.OrderStatus.SEARCHING_WORKER)
    elif current_user.role == models.UserRole.CUSTOMER:
        query = query.filter(models.Order.customer_id == current_user.id)
        if status_filter:
            query = query.filter(models.Order.status == status_filter)
    elif current_user.role == models.UserRole.WORKER:
        query = query.filter(models.Order.worker_id == current_user.id)
        if status_filter:
            query = query.filter(models.Order.status == status_filter)
    elif status_filter:
        query = query.filter(models.Order.status == status_filter)

    return query.order_by(models.Order.created_at.desc()).all()


@app.get(
    "/api/orders/{order_id}",
    response_model=schemas.OrderResponse,
    tags=["Orders & Escrow"],
)
def get_order_by_id(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.get(
    "/api/orders/{order_id}/escrow",
    response_model=schemas.EscrowResponse,
    tags=["Orders & Escrow"],
)
def get_order_escrow(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    escrow = (
        db.query(models.EscrowTransaction)
        .filter(models.EscrowTransaction.order_id == order_id)
        .first()
    )
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow record not found")
    return escrow


@app.post(
    "/api/orders/{order_id}/claim",
    response_model=schemas.OrderResponse,
    tags=["Orders & Escrow"],
)
def claim_order(
    order_id: str,
    current_user: models.User = Depends(require_role(models.UserRole.WORKER)),
    db: Session = Depends(get_db),
):
    # Enforce KYC verification check
    kyc = (
        db.query(models.WorkerKYC)
        .filter(models.WorkerKYC.worker_id == current_user.id)
        .first()
    )
    if not kyc or kyc.status != models.KYCStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker must have an APPROVED KYC document to accept jobs",
        )

    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != models.OrderStatus.SEARCHING_WORKER:
        raise HTTPException(
            status_code=400,
            detail="Order is no longer available for assignment",
        )

    order.worker_id = current_user.id
    order.status = models.OrderStatus.ASSIGNED

    # Link worker to the active escrow record
    if order.escrow:
        order.escrow.worker_id = current_user.id

    db.commit()
    db.refresh(order)
    return order


@app.post(
    "/api/orders/{order_id}/store-purchase",
    response_model=schemas.OrderResponse,
    tags=["Orders & Escrow"],
)
async def record_store_purchase(
    order_id: str,
    actual_item_cost: float = Form(...),
    receipt_file: UploadFile = File(...),
    current_user: models.User = Depends(require_role(models.UserRole.WORKER)),
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.worker_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized for this order"
        )
    if actual_item_cost > order.budget_cap:
        raise HTTPException(
            status_code=400,
            detail=f"Cost exceeds approved customer budget of ₹{order.budget_cap}",
        )

    # Save receipt to disk
    file_ext = os.path.splitext(receipt_file.filename)[1]
    saved_filename = f"receipt_{order_id}_{uuid.uuid4().hex[:6]}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, "receipts", saved_filename)
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(receipt_file.file, buffer)

    order.actual_item_cost = actual_item_cost
    order.store_receipt_url = f"/uploads/receipts/{saved_filename}"
    order.status = models.OrderStatus.IN_TRANSIT
    db.commit()
    db.refresh(order)
    return order


@app.post(
    "/api/orders/{order_id}/complete-delivery",
    response_model=schemas.EscrowResponse,
    tags=["Orders & Escrow"],
)
def complete_delivery(
    order_id: str,
    otp: str,
    current_user: models.User = Depends(require_role(models.UserRole.WORKER)),
    db: Session = Depends(get_db),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.worker_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized for this order"
        )
    if order.delivery_otp != otp:
        raise HTTPException(
            status_code=400, detail="Invalid Delivery Verification OTP"
        )
    if order.status == models.OrderStatus.DELIVERED:
        raise HTTPException(status_code=400, detail="Order is already completed")

    escrow = order.escrow
    if not escrow or escrow.status != models.EscrowStatus.HELD:
        raise HTTPException(
            status_code=400, detail="No funds held in escrow for release"
        )

    # Financial settlement
    worker_payout = round(order.actual_item_cost + order.delivery_fee, 2)
    customer_refund = round(
        escrow.amount_held - (worker_payout + order.service_fee), 2
    )

    escrow.amount_released = worker_payout
    escrow.amount_refunded = max(0.0, customer_refund)
    escrow.status = models.EscrowStatus.RELEASED
    escrow.released_at = datetime.datetime.utcnow()

    order.status = models.OrderStatus.DELIVERED
    order.completed_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(escrow)
    return escrow


# ============================================================================
# WEBSOCKET REAL-TIME GPS TRACKING
# ============================================================================


@app.websocket("/ws/track/{order_id}")
async def customer_tracking_socket(websocket: WebSocket, order_id: str):
    await websocket.accept()
    await manager.connect(order_id, websocket)
    try:
        while True:
            # Keep listener open for ping/pong heartbeats
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)


@app.websocket("/ws/worker/{order_id}")
async def worker_broadcasting_socket(
    websocket: WebSocket, order_id: str, db_session: Session = Depends(get_db)
):
    await websocket.accept()
    await manager.connect(order_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            lat = data.get("latitude")
            lng = data.get("longitude")
            worker_id = data.get("worker_id")

            if lat is not None and lng is not None and worker_id:
                # Save coordinate log to Neon PostgreSQL
                log = models.LocationLog(
                    id=f"LOC_{uuid.uuid4().hex[:8]}",
                    order_id=order_id,
                    worker_id=worker_id,
                    latitude=lat,
                    longitude=lng,
                )
                db_session.add(log)
                db_session.commit()

                # Broadcast immediately to customer listener
                await manager.broadcast_to_order(
                    order_id,
                    {
                        "type": "location_update",
                        "order_id": order_id,
                        "worker_id": worker_id,
                        "latitude": lat,
                        "longitude": lng,
                        "timestamp": log.recorded_at.isoformat(),
                    },
                )
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)