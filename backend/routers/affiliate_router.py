from typing import List, Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from pydantic import BaseModel
import asyncio
import random
from datetime import datetime
from bson import ObjectId
# Assuming services.notification_service and db.database exist
from services.notification_service import NotificationService
from db.database import get_db
from pymongo.database import Database
from langchain_groq import ChatGroq
# Assuming config.settings exists
from config.settings import Settings
import json
import logging
import re
import math
# Added import for date calculation
from dateutil.relativedelta import relativedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Initialization & Setup ---
router = APIRouter(prefix="/api/affiliate", tags=["affiliate"])
settings = Settings()

class MarkAsReadRequest(BaseModel):
    notification_ids: List[str]

class WebSocketConfig(BaseModel):
    frequency: int = 50000
    networks: List[str] = None

# Define models for API response
class OptimizationSuggestion(BaseModel):
    id: str
    type: str
    title: str
    description: str
    impact: str
    estimatedRevenue: float
    effort: str

# New Pydantic Models for Revenue Forecasting
class ForecastMonth(BaseModel):
    month: str
    predicted: int
    confidence: int
    actual: Optional[float] = None

class ScenarioQuarter(BaseModel):
    name: str
    description: str
    q1: int
    q2: int
    q3: int
    q4: int
    total: int
    probability: int

class RevenueForecastResponse(BaseModel):
    forecastData: List[ForecastMonth]
    scenarios: List[ScenarioQuarter]
    positiveIndicators: List[str]
    riskFactors: List[str]

# ---- Entity Pools ----
campaigns = [
    {"name": "Holiday Discounts", "weight": 30},
    {"name": "Electronics Blast", "weight": 25},
    {"name": "Fashion Flash Sale", "weight": 20},
    {"name": "Back-to-School", "weight": 15},
    {"name": "Prime Deals", "weight": 10}
]

products = [
    {"name": "Wireless Earbuds", "weight": 25},
    {"name": "Laptop Stand", "weight": 20},
    {"name": "Gaming Mouse", "weight": 15},
    {"name": "Yoga Mat", "weight": 15},
    {"name": "Smartwatch", "weight": 15},
    {"name": "LED Desk Lamp", "weight": 10}
]

# 💡 NEW: Define payment method IDs matching the frontend for mock consistency
payment_method_ids = ["1", "2", "3", "4"]

# ---- Utility Functions (Condensed for full code display) ----
def weighted_random(items):
    total = sum(item["weight"] for item in items)
    r = random.uniform(0, total)
    for item in items:
        if r < item["weight"]: return item["name"]
        r -= item["weight"]
    return items[-1]["name"]
    
async def generate_event(network_name: str, db: Database):
    # This is a mock data generator, simplified for display
    # Ensure all possible choices are handled, or return a default event type
    chosen_type = random.choice(["impression"] * 5 + ["click"] * 2 + ["conversion", "commission", "payout"])
    now = datetime.now().isoformat()
    campaign = weighted_random(campaigns)
    product = weighted_random(products)

    if chosen_type == "commission":
        return {"event": "commission", "network": network_name, "campaign": campaign, "product": product, "amount": round(random.uniform(5, 55), 2), "orderId": f"{network_name[:3].upper()}{random.randint(0, 999999)}", "date": now}
    elif chosen_type == "click":
        return {"event": "click", "network": network_name, "campaign": campaign, "product": product, "clicks": random.randint(1, 100), "date": now}
    elif chosen_type == "conversion":
        return {"event": "conversion", "network": network_name, "campaign": campaign, "product": product, "commissionAmount": round(random.uniform(10, 80), 2), "orderId": f"{network_name[:3].upper()}{random.randint(0, 999999)}", "date": now}
    elif chosen_type == "payout":
        # 💡 FIX: Added paymentMethodId and made amount negative for withdrawal
        return {"event": "payout", "network": network_name, "amount": round(random.uniform(100, 500), 2) * -1, "status": random.choice(["Completed", "Pending", "Failed"]), "date": now, "paymentMethodId": random.choice(payment_method_ids)}
    elif chosen_type == "impression":
        return {"event": "impression", "network": network_name, "campaign": campaign, "product": product, "impressions": random.randint(100, 1000), "date": now}
        
    # Fallback to prevent returning an empty dictionary, though should be unreachable now
    return {"event": "unknown", "network": network_name, "message": "unhandled mock event", "date": now}

def generate_notification_message(event: dict) -> str:
    # Notification message generator, simplified for display
    # 👇 FIX 1: Add Campaign/Product to COMMISSION message
    if event.get("event") == "commission" and event.get("amount") is not None:
        return (
            f"New commission of ${event['amount']} from {event['network']} "
            f"for '{event.get('product', 'N/A')}' (Campaign: {event.get('campaign', 'N/A')})"
        )
    # 👇 FIX 2: Add Campaign/Product to CONVERSION message
    elif event.get("event") == "conversion" and event.get("commissionAmount") is not None:
        return (
            f"New conversion commission of ${event['commissionAmount']} from {event['network']} "
            f"for '{event.get('product', 'N/A')}' (Campaign: {event.get('campaign', 'N/A')})"
        )
    elif event.get("event") == "payout" and event.get("amount") is not None:
        # 💡 FIX: Use absolute value for display in notification
        return f"Payout of ${abs(event['amount'])} completed from {event['network']}"
    # 👇 FIX 3: Add Campaign/Product to CLICK message
    elif event.get("event") == "click" and event.get("clicks") is not None:
        return (
            f"Traffic spike: {event['clicks']} clicks on '{event.get('product', 'N/A')}' "
            f"(Campaign: {event.get('campaign', 'N/A')}) from {event['network']}"
        )
    # 👇 FIX 4: Add Campaign/Product to IMPRESSION message
    elif event.get("event") == "impression" and event.get("impressions") is not None:
        return (
            f"Ad visibility: {event['impressions']} impressions recorded for '{event.get('product', 'N/A')}' "
            f"(Campaign: {event.get('campaign', 'N/A')}) via {event['network']}"
        )
    
    return f"Unknown event from {event.get('network', 'an unknown source')}"

# ---- New Revenue Forecasting Logic (Ported from Frontend) ----

async def fetch_all_events(db: Database) -> List[Dict[str, Any]]:
    """Fetches all relevant events from the database."""
    events = []
    # Fetch events only needed for analysis
    cursor = db.get_collection("data").find({
        "event": {"$in": ["commission", "conversion", "click", "payout"]} # Include payout here for analysis
    }).sort("date", 1) 
    async for event in cursor:
        # Convert ObjectId to string for JSON compatibility before passing to calculation
        if "_id" in event: event["_id"] = str(event["_id"])
        events.append(event)
    return events

def calculate_campaign_metrics(events: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    """Calculates revenue, commissions, clicks, and conversion rates for all campaigns."""
    campaign_metrics: Dict[str, Dict[str, float]] = {c['name']: {"revenue": 0.0, "commissions": 0.0, "clicks": 0.0} for c in campaigns}
    campaign_clicks: Dict[str, int] = {c['name']: 0 for c in campaigns}

    for event in events:
        campaign_name = event.get("campaign")
        if not campaign_name or campaign_name not in campaign_metrics:
            continue
        
        if event["event"] in ["commission", "conversion"]:
            amount = event.get("commissionAmount", event.get("amount", 0))
            if isinstance(amount, (int, float)):
                campaign_metrics[campaign_name]["revenue"] += amount
                campaign_metrics[campaign_name]["commissions"] += 1
        
        elif event["event"] == "click" and "clicks" in event and isinstance(event["clicks"], (int, float)):
            campaign_clicks[campaign_name] += event["clicks"]
            
    final_metrics = {}
    for name, metrics in campaign_metrics.items():
        clicks = campaign_clicks.get(name, 0)
        commissions = metrics['commissions']
        conversion_rate = (commissions / clicks * 100) if clicks > 0 else 0
        final_metrics[name] = {
            "revenue": round(metrics['revenue'], 2),
            "commissions": commissions,
            "clicks": clicks,
            "conversionRate": round(conversion_rate, 2)
        }

    return final_metrics

def calculate_forecast_and_scenarios(events: List[Dict[str, Any]], campaign_metrics: Dict[str, Dict[str, float]]) -> RevenueForecastResponse:
    
    # 1. Calculate historical monthly revenues
    monthly_data: Dict[str, float] = {}
    for event in events:
        if event.get("event") in ["commission", "conversion"] and event.get("date"):
            try:
                event_date = datetime.fromisoformat(event["date"].replace('Z', '+00:00'))
                month_key = event_date.strftime('%Y-%m')
                amount = event.get("commissionAmount", event.get("amount", 0))
                if isinstance(amount, (int, float)):
                    monthly_data[month_key] = monthly_data.get(month_key, 0) + amount
            except Exception:
                pass

    # 2. Calculate average monthly revenue and growth rate
    revenues = list(monthly_data.values())
    sorted_months = sorted(monthly_data.keys())
    
    average_monthly_revenue = sum(revenues) / len(revenues) if len(revenues) > 0 else 0
    
    total_growth = 0
    growth_count = 0
    for i in range(1, len(sorted_months)):
        prev_revenue = monthly_data[sorted_months[i - 1]]
        curr_revenue = monthly_data[sorted_months[i]]
        if prev_revenue > 0:
            total_growth += ((curr_revenue - prev_revenue) / prev_revenue) * 100
            growth_count += 1
    monthly_growth_rate = total_growth / growth_count if growth_count > 0 else 0

    # 3. Generate 6-month forecast
    forecasts: List[Dict[str, Any]] = []
    start_date = datetime.now().replace(day=1) + relativedelta(months=1)
    last_revenue = average_monthly_revenue if average_monthly_revenue > 0 else 1000
    
    # Confidence calculation
    mean = sum(revenues) / len(revenues) if len(revenues) > 0 else 0
    variance = sum(math.pow(r - mean, 2) for r in revenues) / len(revenues) if len(revenues) > 0 else 0
    std_dev = math.sqrt(variance)
    base_confidence = 90 if len(revenues) >= 3 else (80 if len(revenues) >= 1 else 70)
    confidence_adjustment = min(20, (std_dev / mean) * 100) if mean > 0 else 0

    for i in range(6):
        date = start_date + relativedelta(months=i)
        predicted = round(last_revenue * (1 + monthly_growth_rate / 100))
        confidence = max(70, round(base_confidence - confidence_adjustment))

        forecasts.append({
            "month": date.strftime('%B %Y'),
            "predicted": predicted,
            "confidence": confidence,
            "actual": None,
        })
        last_revenue = predicted

    # 4. Generate scenario planning
    base_revenue = average_monthly_revenue if average_monthly_revenue > 0 else 1000
    conservative_growth = max(0, monthly_growth_rate * 0.5)
    optimistic_growth = monthly_growth_rate * 1.0 
    aggressive_growth = monthly_growth_rate * 2.0

    def calculate_quarterly(growth_rate: float):
        quarterly_projections = []
        for i in range(4):
            # This logic mimics the simple frontend growth calculation
            monthly_proj = base_revenue * math.pow((1 + growth_rate / 100), i)
            quarterly_projections.append(round(monthly_proj * 3))
        return quarterly_projections
    
    scenarios = [
        {"name": "Conservative", "description": "Based on current performance with minimal growth", "q_projections": calculate_quarterly(conservative_growth), "probability": 85},
        {"name": "Optimistic", "description": "Assuming successful implementation of optimization suggestions", "q_projections": calculate_quarterly(optimistic_growth), "probability": 65},
        {"name": "Aggressive", "description": "With new market expansion and increased ad spend", "q_projections": calculate_quarterly(aggressive_growth), "probability": 35},
    ]

    final_scenarios: List[Dict[str, Any]] = []
    for s in scenarios:
        projections = s["q_projections"]
        final_scenarios.append({
            "name": s["name"],
            "description": s["description"],
            "q1": projections[0],
            "q2": projections[1],
            "q3": projections[2],
            "q4": projections[3],
            "total": sum(projections),
            "probability": s["probability"],
        })

    # 5. Generate key factors
    sorted_campaigns = sorted(
        campaign_metrics.items(),
        key=lambda item: item[1]['revenue'],
        reverse=True
    )

    positive_indicators = [
        f"{name} contributing ${metrics['revenue']:,.0f} in revenue"
        for name, metrics in sorted_campaigns[:3]
    ] or ["No significant revenue drivers yet"]

    risk_factors = [
        f"Low performance in {name} ({metrics.get('conversionRate', 0):.1f}% conversion rate)"
        for name, metrics in sorted_campaigns[-2:] if len(sorted_campaigns) > 2
    ] or ["Insufficient data to identify risks"]


    return RevenueForecastResponse(
        forecastData=forecasts,
        scenarios=final_scenarios,
        positiveIndicators=positive_indicators,
        riskFactors=risk_factors
    )

# --- Endpoints ---

@router.get("/revenue-forecast", response_model=RevenueForecastResponse)
async def get_revenue_forecast(db: Database = Depends(get_db)):
    """
    Generates a 6-month revenue forecast and scenario planning based on historical data.
    """
    try:
        events = await fetch_all_events(db)
        campaign_metrics = calculate_campaign_metrics(events)
        forecast_data = calculate_forecast_and_scenarios(events, campaign_metrics)
        return forecast_data
    except Exception as e:
        logger.error(f"Error generating revenue forecast: {str(e)}")
        # Return a structured error response
        raise HTTPException(status_code=500, detail=f"Failed to generate revenue forecast: {str(e)}")

# --- Original Endpoints (Unchanged logic for Optimization & Events) ---
async def generate_optimization_suggestions(db: Database) -> List[OptimizationSuggestion]:
    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",
        temperature=0.7
    )

    campaign_metrics = calculate_campaign_metrics(await fetch_all_events(db))
    # Only expose revenue, commissions, clicks, and conversionRate
    metrics_for_prompt = {
        name: {k: v for k, v in metrics.items() if k in ["revenue", "commissions", "clicks", "conversionRate"]}
        for name, metrics in campaign_metrics.items()
    }

    prompt = (
        "You are an expert in affiliate marketing optimization. Based on the following campaign metrics, "
        "generate exactly 3 optimization suggestions to improve affiliate revenue. Each suggestion must include: "
        "an ID (unique string), type (campaign, keyword, audience, or creative), title, description, "
        "impact (high, medium, low), estimatedRevenue (in USD as a float), and effort (high, medium, low). "
        "Return the suggestions as a valid JSON array, with no additional text or formatting outside the array. "
        "Here are the campaign metrics:\n"
        f"{json.dumps(metrics_for_prompt, indent=2)}\n"
        "Example response:\n"
        '[{"id": "1", "type": "campaign", "title": "Increase Budget", "description": "Increase budget for high-performing campaign.", '
        '"impact": "high", "estimatedRevenue": 2500.0, "effort": "low"}]'
    )

    try:
        response = await llm.ainvoke(prompt)
        logger.info(f"Raw Groq response: {response.content}")

        # Corrected Regex: Extract JSON array from the response
        json_match = re.search(r'\[[\s\S]*?\]', response.content, re.DOTALL)
        if not json_match:
            logger.error("No valid JSON array found in Groq response")
            raise ValueError("No valid JSON array found in Groq response")

        json_str = json_match.group(0)
        logger.info(f"Extracted JSON: {json_str}")

        suggestions = json.loads(json_str)
        if not isinstance(suggestions, list):
            raise ValueError("Groq response is not a JSON array")

        validated_suggestions = []
        for idx, suggestion in enumerate(suggestions):
            try:
                # Use strict validation against the Pydantic model
                validated_suggestion = OptimizationSuggestion(**suggestion)
                validated_suggestions.append(validated_suggestion)
            except Exception as e:
                logger.error(f"Invalid suggestion at index {idx}: {str(e)}")
                continue

        if not validated_suggestions:
            raise ValueError("No valid suggestions found in Groq response")

        return validated_suggestions
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Validation/Decode error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Invalid Groq response format: {str(e)}")
    except Exception as e:
        logger.error(f"Error generating optimization suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate optimization suggestions: {str(e)}")


@router.get("/optimization-suggestions")
async def get_optimization_suggestions(db: Database = Depends(get_db)):
    try:
        suggestions = await generate_optimization_suggestions(db)
        return {"suggestions": suggestions}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate optimization suggestions: {str(e)}")

@router.get("/events")
async def get_all_events(db: Database = Depends(get_db)):
    try:
        all_events = []
        async for event in db.get_collection("data").find().sort("date", -1):
            if "_id" in event:
                event["_id"] = str(event["_id"])
            all_events.append(event)
        return {"events": all_events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
@router.get("/notifications")
async def get_all_notifications(db: Database = Depends(get_db)):
    try:
        notifications_collection = db.get_collection("notifications")
        notifications = []
        async for notification in notifications_collection.find({"user_id": "user_id_from_token"}).sort("created_at", -1):
            notification["_id"] = str(notification["_id"])
            if "read" not in notification:
                notification["read"] = False
            if "created_at" in notification and isinstance(notification["created_at"], datetime):
                notification["created_at"] = notification["created_at"].isoformat()
            notifications.append(notification)
        return {"notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.websocket("/ws/{network_name}-events")
async def websocket_network_events(websocket: WebSocket, network_name: str, db: Database = Depends(get_db)):
    await websocket.accept()
    # Instantiate NotificationService here, as done in the example you provided
    notification_service = NotificationService(db)
    user_id = "user_id_from_token"
    
    # Initialize config
    config = WebSocketConfig(frequency=50000, networks=[network_name])

    try:
        while True:
            # 1. Handle incoming config updates
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.1)
                if "config" in data:
                    client_config = data["config"]
                    if client_config.get("frequency", 0) >= 1000:
                        config.frequency = client_config["frequency"]
                    
                    # Update networks config if provided by client (optional, based on your reference)
                    valid_networks = client_config.get("networks")
                    if valid_networks is not None and network_name in valid_networks:
                        config.networks = valid_networks

            except asyncio.TimeoutError:
                pass # No config update received

            # 2. Generate and store event
            event_data = await generate_event(network_name, db)
            
            # Basic validation
            if not event_data or not event_data.get("event"):
                logger.warning(f"Skipping empty or invalid event for {network_name}")
                await asyncio.sleep(config.frequency / 1000)
                continue

            inserted_event = await db.get_collection("data").insert_one(event_data)
            full_event = await db.get_collection("data").find_one({"_id": inserted_event.inserted_id})
            
            if full_event and "_id" in full_event: full_event["_id"] = str(full_event["_id"])

            # 3. Create rich notification document (similar to your reference code)
            notification_message = generate_notification_message(event_data)

            new_notification = {
                "user_id": user_id,
                "message": notification_message,
                "type": event_data["event"],
                "network": event_data["network"],  # Explicitly captured network
                "amount": event_data.get("amount"),
                "clicks": event_data.get("clicks"),
                "status": event_data.get("status"),
                "paymentMethodId": event_data.get("paymentMethodId"), # Captured payment ID
                "created_at": datetime.now(),
                "read": False
            }
            
            # 4. Insert notification
            inserted_notification = await db.get_collection("notifications").insert_one(new_notification)
            full_notification = await db.get_collection("notifications").find_one({"_id": inserted_notification.inserted_id})
            
            if full_notification and "_id" in full_notification:
                full_notification["_id"] = str(full_notification["_id"])
                if "created_at" in full_notification and isinstance(full_notification["created_at"], datetime):
                    full_notification["created_at"] = full_notification["created_at"].isoformat()

            # 5. Use NotificationService (The service call is commented out as it likely relies on an external/mocked class)
            # await notification_service.create_notification(user_id, notification_message, event_data["event"])
            
            # 6. Send combined event and notification data
            combined_data = {"event": full_event, "notification": full_notification}
            await websocket.send_json(combined_data)

            # 7. Sleep based on config frequency (convert ms to seconds)
            await asyncio.sleep(config.frequency / 1000)

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from {network_name}: {websocket.client}")
    except Exception as e:
        logger.error(f"Error in WebSocket for {network_name}: {e}")
        # Send error message to client
        try:
            await websocket.send_json({"error": f"An unexpected error occurred: {str(e)}"})
        except WebSocketDisconnect:
            pass # Client already disconnected

@router.post("/notifications/mark-read")
async def mark_notifications_as_read(request: MarkAsReadRequest, db: Database = Depends(get_db)):
    try:
        user_id = "user_id_from_token"
        result = await db.get_collection("notifications").update_many(
            {"_id": {"$in": [ObjectId(id) for id in request.notification_ids]}, "user_id": user_id},
            {"$set": {"read": True}}
        )
        return {"message": f"{result.modified_count} notifications marked as read."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
@router.get("/")
async def root():
    return {"message": "Affiliate Command Center Real-Time Mock API Server Running"}