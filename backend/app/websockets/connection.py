from typing import Dict, List, Any
from fastapi import WebSocket
import json
import logging
from uuid import UUID

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Store active connections: {client_id -> WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Connect a new client and store their WebSocket"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(
            f"Client {client_id} connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, client_id: str) -> None:
        """Disconnect a client and remove their WebSocket"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(
                f"Client {client_id} disconnected. Remaining connections: {len(self.active_connections)}"
            )

    async def send_update(
        self, client_id: str, task_id: str, status: str, step: str, data: Any = None
    ) -> None:
        """Send a task status update to a specific client"""
        if client_id in self.active_connections:
            message = {
                "task_id": task_id,
                "status": status,
                "step": step,
                "data": data or {},
            }
            await self.active_connections[client_id].send_json(message)
        else:
            logger.warning(
                f"Attempted to send message to non-existent client: {client_id}"
            )

    async def broadcast(self, message: Dict) -> None:
        """Send a message to all connected clients"""
        disconnected_clients = []
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to client {client_id}: {str(e)}")
                disconnected_clients.append(client_id)

        # Clean up any disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)


# Create a singleton instance
connection_manager = ConnectionManager()
