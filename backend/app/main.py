from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.patients import router as patients_router
from app.api.v1.routes.users import router as users_router
from app.api.v1.routes.prediction import router as prediction_router


# CREATE FASTAPI APP FIRST
app = FastAPI(
    title="Disease Prediction System - Auth API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(users_router, prefix="/api/v1")
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(prediction_router)

# ROOT
@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Disease Prediction API is running"
    }