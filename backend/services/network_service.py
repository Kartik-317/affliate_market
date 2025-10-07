from fastapi import HTTPException
from pymongo.database import Database
from models.network import NetworkConnection
from typing import List, Dict

class NetworkService:
    def __init__(self, db: Database):
        self.db = db

    async def connect_network(self, user_id: str, network_data: Dict) -> Dict:
        network = NetworkConnection(**network_data, user_id=user_id)
        result = await self.db.networks.insert_one(network.dict())
        return {"id": str(result.inserted_id), "message": "Network connected successfully"}

    async def get_networks(self, user_id: str) -> List[Dict]:
        networks = await self.db.networks.find({"user_id": user_id}).to_list(None)
        return networks