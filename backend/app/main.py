import datetime
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal, get_db
from . import models, schemas
from .websocket import ConnectionManager

# Initialize Firebase Admin SDK
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase ID Token: {str(e)}")

def check_role(role: str):
    def dependency(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
        user_id = user.get("uid")
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=403, detail="User profile not found in local database")
        if db_user.role != role and db_user.role != "admin":
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return db_user
    return dependency


app = FastAPI(title="PickPal Live Location Service")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ConnectionManager
manager = ConnectionManager()

# Create PostgreSQL tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"status": "running", "service": "PickPal Live Location"}

# User Registration
@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user.get("uid") != user.id:
        raise HTTPException(status_code=403, detail="Cannot register profile for another user")
    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if db_user:
        return db_user
    new_user = models.User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Order Sourcing Creation
@app.post("/api/orders", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user or (db_user.role != "customer" and db_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Only customers can create orders")
    if order.customer_id != user_id:
        raise HTTPException(status_code=403, detail="customer_id must match authenticated user")
        
    db_order = db.query(models.Order).filter(models.Order.id == order.id).first()
    if db_order:
        return db_order
    new_order = models.Order(**order.dict())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# REST endpoint for HTTP-based GPS updates (fallback/alternative to WS)
@app.post("/api/location/update", response_model=schemas.LocationResponse)
async def update_location(payload: schemas.LocationUpdate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    if payload.worker_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot update location for another worker")
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user or (db_user.role != "worker" and db_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Only workers can update location")
        
    db_order = db.query(models.Order).filter(models.Order.id == payload.order_id).first()
    if not db_order or (db_order.worker_id != user_id and db_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Worker is not assigned to this order")

    # Save log to PostgreSQL
    new_log = models.LocationLog(
        worker_id=payload.worker_id,
        order_id=payload.order_id,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # Broadcast to all connected tracking clients for this order
    message = {
        "type": "location_update",
        "worker_id": payload.worker_id,
        "order_id": payload.order_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "timestamp": new_log.timestamp.isoformat()
    }
    await manager.broadcast_to_order(payload.order_id, message)
    return new_log

# WebSocket Tracking Channel (Customer / Admin listens here)
@app.websocket("/ws/track/{order_id}")
async def websocket_track(websocket: WebSocket, order_id: str, token: str = None):
    if not token:
        await websocket.accept()
        await websocket.close(code=4001)
        return
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
    except Exception as e:
        await websocket.accept()
        await websocket.close(code=4002)
        return
        
    db: Session = SessionLocal()
    try:
        db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_order or not db_user:
            await websocket.accept()
            await websocket.close(code=4003)
            return
        if db_user.role != "admin" and db_order.customer_id != user_id and db_order.worker_id != user_id:
            await websocket.accept()
            await websocket.close(code=4003)
            return
    finally:
        db.close()

    await websocket.accept()
    await manager.connect(order_id, websocket)
    try:
        while True:
            # Keep connection open and await incoming heartbeats or close frames
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)

# WebSocket Worker Broadcast Channel (Worker streams coordinates here)
@app.websocket("/ws/worker/{worker_id}/order/{order_id}")
async def websocket_worker(websocket: WebSocket, worker_id: str, order_id: str, token: str = None):
    if not token:
        await websocket.accept()
        await websocket.close(code=4001)
        return
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
    except Exception as e:
        await websocket.accept()
        await websocket.close(code=4002)
        return
        
    if user_id != worker_id:
        await websocket.accept()
        await websocket.close(code=4003)
        return

    db: Session = SessionLocal()
    try:
        db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_order or not db_user:
            await websocket.accept()
            await websocket.close(code=4003)
            return
        if db_user.role != "worker" or db_order.worker_id != user_id:
            await websocket.accept()
            await websocket.close(code=4003)
            return
    finally:
        db.close()

    await websocket.accept()
    await manager.connect(order_id, websocket)
    db_session: Session = SessionLocal()
    try:
        while True:
            # Expecting JSON: {"latitude": float, "longitude": float}
            data = await websocket.receive_json()
            lat = data.get("latitude")
            lng = data.get("longitude")

            if lat is None or lng is None:
                continue

            # Log location to PostgreSQL
            new_log = models.LocationLog(
                worker_id=worker_id,
                order_id=order_id,
                latitude=lat,
                longitude=lng
            )
            db_session.add(new_log)
            db_session.commit()

            # Broadcast coordinates in real-time
            message = {
                "type": "location_update",
                "worker_id": worker_id,
                "order_id": order_id,
                "latitude": lat,
                "longitude": lng,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            await manager.broadcast_to_order(order_id, message)
    except WebSocketDisconnect:
        manager.disconnect(order_id, websocket)
    finally:
        db_session.close()

