from fastapi import FastAPI
from routers import auth_router, dashboard_router, network_router, notification_router, payment_router, analytics_router,affiliate_router,tax_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Affiliate Command Center")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(dashboard_router.router)
app.include_router(network_router.router)
app.include_router(notification_router.router)
app.include_router(payment_router.router)
app.include_router(analytics_router.router)
app.include_router(tax_router.router)
app.include_router(affiliate_router.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Affiliate Command Center"}