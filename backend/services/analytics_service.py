from pymongo.database import Database
from typing import List, Dict
from datetime import datetime, timedelta

class AnalyticsService:
    def __init__(self, db: Database):
        self.db = db

    async def get_analytics(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict:
        pipeline = [
            {"$match": {
                "user_id": user_id,
                "created_at": {"$gte": start_date, "$lte": end_date}
            }},
            {"$group": {
                "_id": "$network_id",
                "total_earned": {"$sum": "$amount"},
                "transaction_count": {"$sum": 1}
            }}
        ]
        results = await self.db.payments.aggregate(pipeline).to_list(None)
        return {"analytics": results}