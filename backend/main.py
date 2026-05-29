from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import logging

# Import all components
from config import settings
from database import get_db, init_db
from auth import (
    get_current_user, get_current_admin, get_current_doctor, 
    get_current_society, create_access_token, verify_password, hash_password
)
from models import User, DiseaseCase, District, RiskPrediction, Alert, MLModel, Taluk
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    DiseaseCaseCreate, DiseaseCaseResponse, DiseaseCaseUpdate,
    DistrictResponse, DistrictGeoResponse,
    RiskPredictionResponse, AlertResponse, AlertMarkAsRead,
    DoctorDashboardResponse, AdminDashboardResponse, SocietyDashboardResponse,
    BulkCaseUpload, BulkUploadResponse, MLModelResponse,
    ModelRetrainingRequest, ModelRetrainingResponse
)
from ml_trainer import update_risk_predictions, predictor
from datetime import date, timedelta as dt_timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Medical GIS Disease Prediction System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

# ==================== Authentication Endpoints ====================

@app.post("/api/v1/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        organization=user_data.organization
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/v1/auth/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/v1/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ==================== Doctor Endpoints ====================

@app.post("/api/v1/cases", response_model=DiseaseCaseResponse)
async def create_disease_case(
    case_data: DiseaseCaseCreate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Create a new disease case (Doctor only)"""
    case = DiseaseCase(
        doctor_id=current_user.id,
        patient_name=case_data.patient_name,
        patient_age=case_data.patient_age,
        patient_gender=case_data.patient_gender,
        disease_type=case_data.disease_type,
        latitude=case_data.latitude,
        longitude=case_data.longitude,
        case_date=case_data.case_date,
        severity=case_data.severity,
        symptoms=case_data.symptoms,
        notes=case_data.notes
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    
    # Update risk predictions after new case
    update_risk_predictions(db, [case_data.disease_type])
    
    return case

@app.get("/api/v1/cases", response_model=List[DiseaseCaseResponse])
async def get_doctor_cases(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all cases reported by doctor"""
    cases = db.query(DiseaseCase).filter(
        DiseaseCase.doctor_id == current_user.id
    ).order_by(DiseaseCase.created_at.desc()).all()
    return cases

@app.put("/api/v1/cases/{case_id}", response_model=DiseaseCaseResponse)
async def update_disease_case(
    case_id: int,
    case_data: DiseaseCaseUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update a disease case"""
    case = db.query(DiseaseCase).filter(
        DiseaseCase.id == case_id,
        DiseaseCase.doctor_id == current_user.id
    ).first()
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update fields
    for field, value in case_data.dict(exclude_unset=True).items():
        setattr(case, field, value)
    
    db.commit()
    db.refresh(case)
    return case

@app.get("/api/v1/dashboard/doctor", response_model=DoctorDashboardResponse)
async def doctor_dashboard(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get doctor dashboard"""
    today = date.today()
    
    # Total cases
    total_cases = db.query(DiseaseCase).filter(
        DiseaseCase.doctor_id == current_user.id
    ).count()
    
    # Cases this month
    cases_this_month = db.query(DiseaseCase).filter(
        DiseaseCase.doctor_id == current_user.id,
        DiseaseCase.case_date >= today.replace(day=1)
    ).count()
    
    # Active alerts
    active_alerts = db.query(Alert).filter(
        Alert.user_id == current_user.id,
        Alert.is_read == False
    ).count()
    
    # Recent cases
    recent_cases = db.query(DiseaseCase).filter(
        DiseaseCase.doctor_id == current_user.id
    ).order_by(DiseaseCase.created_at.desc()).limit(5).all()
    
    # High risk districts
    high_risk = db.query(RiskPrediction).filter(
        RiskPrediction.risk_score >= 70
    ).order_by(RiskPrediction.risk_score.desc()).limit(5).all()
    
    high_risk_districts = [
        {
            "id": p.district_id,
            "name": db.query(District).get(p.district_id).name,
            "risk_score": float(p.risk_score),
            "disease": p.disease_type
        }
        for p in high_risk
    ]
    
    return {
        "total_cases": total_cases,
        "cases_this_month": cases_this_month,
        "active_alerts": active_alerts,
        "recent_cases": recent_cases,
        "high_risk_districts": high_risk_districts
    }

# ==================== Admin Endpoints ====================

@app.get("/api/v1/dashboard/admin", response_model=AdminDashboardResponse)
async def admin_dashboard(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard"""
    total_users = db.query(User).count()
    total_cases = db.query(DiseaseCase).count()
    total_alerts = db.query(Alert).count()
    active_doctors = db.query(User).filter(User.role == "doctor", User.is_active == True).count()
    
    # Get latest model
    latest_model = db.query(MLModel).filter(MLModel.is_active == True).order_by(MLModel.created_at.desc()).first()
    model_accuracy = float(latest_model.accuracy) if latest_model and latest_model.accuracy else 0.0
    last_training_date = latest_model.training_date if latest_model else None
    
    return {
        "total_users": total_users,
        "total_cases": total_cases,
        "total_alerts": total_alerts,
        "active_doctors": active_doctors,
        "model_accuracy": model_accuracy,
        "last_training_date": last_training_date
    }

@app.get("/api/v1/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    role: str = None
):
    """Get all users (Admin only)"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()

@app.put("/api/v1/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Activate/deactivate user"""
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}

@app.post("/api/v1/ml/retrain", response_model=ModelRetrainingResponse)
async def retrain_model(
    request: ModelRetrainingRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Retrain the ML model (Admin only)"""
    accuracy, status_msg = predictor.train(db)
    return {
        "success": status_msg == "success",
        "accuracy": accuracy,
        "message": status_msg
    }

@app.get("/api/v1/ml/models", response_model=List[MLModelResponse])
async def get_models(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all trained models"""
    return db.query(MLModel).order_by(MLModel.created_at.desc()).all()

# ==================== Society Endpoints ====================

@app.get("/api/v1/dashboard/society", response_model=SocietyDashboardResponse)
async def society_dashboard(
    current_user: User = Depends(get_current_society),
    db: Session = Depends(get_db)
):
    """Get society dashboard with public health info"""
    # High risk districts
    high_risk = db.query(RiskPrediction).filter(
        RiskPrediction.risk_score >= 70
    ).order_by(RiskPrediction.risk_score.desc()).limit(10).all()
    
    high_risk_districts = [
        {
            "id": p.district_id,
            "name": db.query(District).get(p.district_id).name,
            "risk_score": float(p.risk_score),
            "disease": p.disease_type
        }
        for p in high_risk
    ]
    
    # Disease statistics
    disease_stats = {}
    diseases = db.query(DiseaseCase.disease_type).distinct().all()
    for disease_tuple in diseases:
        disease = disease_tuple[0]
        count = db.query(DiseaseCase).filter(DiseaseCase.disease_type == disease).count()
        disease_stats[disease] = count
    
    # Population affected
    total_cases = db.query(DiseaseCase).count()
    population_affected = total_cases * 5  # Estimate
    
    # Recent alerts
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(10).all()
    
    return {
        "high_risk_districts": high_risk_districts,
        "disease_statistics": disease_stats,
        "population_affected": population_affected,
        "recent_alerts": recent_alerts
    }

# ==================== Map & District Endpoints ====================

@app.get("/api/v1/districts", response_model=List[DistrictResponse])
async def get_districts(db: Session = Depends(get_db)):
    """Get all districts"""
    return db.query(District).all()

@app.get("/api/v1/districts/{district_id}/risks")
async def get_district_risks(
    district_id: int,
    db: Session = Depends(get_db)
):
    """Get risk predictions for a district"""
    predictions = db.query(RiskPrediction).filter(
        RiskPrediction.district_id == district_id
    ).order_by(RiskPrediction.prediction_date.desc()).limit(10).all()
    
    return [{
        "disease": p.disease_type,
        "risk_score": float(p.risk_score),
        "date": p.prediction_date,
        "confidence": float(p.confidence) if p.confidence else None
    } for p in predictions]

@app.get("/api/v1/taluks/{district_id}")
async def get_taluks(
    district_id: int,
    db: Session = Depends(get_db)
):
    """Get all taluks in a district"""
    taluks = db.query(Taluk).filter(Taluk.district_id == district_id).all()
    return [{
        "id": t.id,
        "name": t.name,
        "population": t.population
    } for t in taluks]

# ==================== Alerts Endpoints ====================

@app.get("/api/v1/alerts", response_model=List[AlertResponse])
async def get_user_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = False
):
    """Get user alerts"""
    query = db.query(Alert).filter(Alert.user_id == current_user.id)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    return query.order_by(Alert.created_at.desc()).all()

@app.put("/api/v1/alerts/{alert_id}", response_model=AlertResponse)
async def mark_alert_read(
    alert_id: int,
    data: AlertMarkAsRead,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark alert as read/unread"""
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_read = data.is_read
    db.commit()
    db.refresh(alert)
    return alert

# ==================== Bulk Upload Endpoint ====================

@app.post("/api/v1/cases/bulk", response_model=BulkUploadResponse)
async def bulk_upload_cases(
    upload_data: BulkCaseUpload,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Bulk upload disease cases"""
    successful = 0
    failed = 0
    errors = []
    
    for case_data in upload_data.cases:
        try:
            case = DiseaseCase(
                doctor_id=current_user.id,
                **case_data.dict()
            )
            db.add(case)
            successful += 1
        except Exception as e:
            failed += 1
            errors.append(str(e))
    
    try:
        db.commit()
        # Update risk predictions
        disease_types = list(set([c.disease_type for c in upload_data.cases]))
        update_risk_predictions(db, disease_types)
    except Exception as e:
        db.rollback()
        return {
            "total_uploaded": 0,
            "failed_count": len(upload_data.cases),
            "errors": [str(e)]
        }
    
    return {
        "total_uploaded": successful,
        "failed_count": failed,
        "errors": errors
    }

# ==================== Health Check ====================

@app.get("/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
