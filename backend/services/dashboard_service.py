from fastapi import HTTPException
from pymongo.database import Database
from typing import List, Dict

class DashboardService:
    def __init__(self, db: Database):
        self.db = db

    async def get_dashboard_data(self, user_id: str) -> Dict:
        networks = await self.db.networks.find({"user_id": user_id}).to_list(None)
        commissions = await self.db.payments.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "total_earned": {"$sum": "$amount"},
                "pending": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, "$amount", 0]}}
            }}
        ]).to_list(None)
        
        return {
            "networks_connected": len(networks),
            "total_earned": commissions[0]["total_earned"] if commissions else 0,
            "pending_payments": commissions[0]["pending"] if commissions else 0,
            "recent_activity": await self.get_recent_activity(user_id)
        }

    async def get_recent_activity(self, user_id: str) -> List[Dict]:
        notifications = await self.db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(10).to_list(None)
        return notifications