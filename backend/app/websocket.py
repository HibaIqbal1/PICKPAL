from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Maps order_id -> list of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, order_id: str, websocket: WebSocket):
        await websocket.accept()
        if order_id not in self.active_connections:
            self.active_connections[order_id] = []
        self.active_connections[order_id].append(websocket)

    def disconnect(self, order_id: str, websocket: WebSocket):
        if order_id in self.active_connections:
            if websocket in self.active_connections[order_id]:
                self.active_connections[order_id].remove(websocket)
            if not self.active_connections[order_id]:
                del self.active_connections[order_id]

    async def broadcast_to_order(self, order_id: str, message: dict):
        if order_id in self.active_connections:
            # Create a copy of the list to iterate to avoid concurrent modification issues
            for connection in list(self.active_connections[order_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Failed to broadcast JSON to WS client: {e}")
                    # Auto-cleanup broken connections
                    self.disconnect(order_id, connection)
