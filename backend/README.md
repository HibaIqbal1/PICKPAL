# PickPal Live Location Backend Module (FastAPI & WebSockets)

This is a self-contained FastAPI backend module that coordinates real-time worker location updates using WebSockets and saves the tracking logs into a PostgreSQL database.

## Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI server routes & WebSocket endpoints
│   ├── database.py      # SQLAlchemy PostgreSQL config
│   ├── models.py        # SQLAlchemy Models (User, Order, LocationLog)
│   ├── schemas.py       # Pydantic validation schemas
│   └── websocket.py     # ConnectionManager for WS sessions by order_id
├── requirements.txt     # Python requirements
└── README.md            # This documentation
```

## Prerequisites
- Python 3.8+
- PostgreSQL server running locally or hosted.

## Setup & Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a python virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows (cmd/powershell):
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Database Connection (Optional):
   Set the `DATABASE_URL` environment variable if your PostgreSQL config differs from the default:
   ```bash
   # Default URI is: postgresql://postgres:postgres@localhost:5432/pickpal
   # To override:
   set DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_db
   ```

5. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The Swagger Interactive API documentation will be available at: `http://localhost:8000/docs`.

---

## API & WebSocket Endpoint Mapping

### REST Endpoints
- `POST /api/users` : Creates a new user profile mirroring the Firebase UID.
- `POST /api/orders` : Creates a new order database entry.
- `POST /api/location/update` : Pushes a worker GPS coordinate, logs it to PostgreSQL, and broadcasts the coordinate to tracking WebSockets.

### WebSocket Endpoints
- **Track Channel (Customer/Admin)**: `ws://localhost:8000/ws/track/{order_id}`
  - The customer/admin client connects here to receive the streaming updates of the worker's coordinate.
  - Receives JSON payload:
    ```json
    {
      "type": "location_update",
      "worker_id": "string",
      "order_id": "string",
      "latitude": 0.0,
      "longitude": 0.0,
      "timestamp": "ISO-8601 string"
    }
    ```

- **Worker Broadcast Channel**: `ws://localhost:8000/ws/worker/{worker_id}/order/{order_id}`
  - The worker client streams their live GPS updates to this socket.
  - Expects incoming JSON payload:
    ```json
    {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
    ```
  - Upon receipt, the backend inserts the coordinate log into PostgreSQL and broadcasts the location update instantly.
