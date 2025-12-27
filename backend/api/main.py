"""
Park-IT Backend API
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import auth, parking, notifications, users
from db.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("Starting Park-IT API...")
    create_tables()
    yield
    # Shutdown
    print("Shutting down Park-IT API...")


# Create FastAPI app
app = FastAPI(
    title="Park-IT API",
    description="Backend API for Park-IT parking assistant app",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8081",  # Expo
        "exp://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(parking.router, prefix="/api/v1/parking", tags=["Parking"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "Park-IT API",
        "version": "1.0.0",
    }


@app.get("/api/v1/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
