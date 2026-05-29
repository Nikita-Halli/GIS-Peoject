from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(..., pattern="^(doctor|admin|society)$")
    phone: Optional[str] = None
    organization: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Disease Case schemas
class DiseaseCaseBase(BaseModel):
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    disease_type: str
    latitude: float
    longitude: float
    case_date: date
    severity: Optional[str] = Field(None, pattern="^(mild|moderate|severe)$")
    symptoms: Optional[str] = None
    notes: Optional[str] = None

class DiseaseCaseCreate(DiseaseCaseBase):
    pass

class DiseaseCaseResponse(DiseaseCaseBase):
    id: int
    doctor_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DiseaseCaseUpdate(BaseModel):
    patient_name: Optional[str] = None
    severity: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None

# District schemas
class DistrictBase(BaseModel):
    name: str
    state: str
    population: Optional[int] = None
    area: Optional[float] = None

class DistrictResponse(DistrictBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class DistrictGeoResponse(DistrictResponse):
    geometry: Optional[dict] = None

# Risk Prediction schemas
class RiskPredictionBase(BaseModel):
    disease_type: str
    risk_score: float = Field(..., ge=0, le=100)
    confidence: Optional[float] = None

class RiskPredictionResponse(RiskPredictionBase):
    id: int
    district_id: int
    taluk_id: Optional[int] = None
    prediction_date: date
    model_version: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Alert schemas
class AlertResponse(BaseModel):
    id: int
    alert_type: str
    message: str
    related_district_id: Optional[int] = None
    risk_level: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AlertMarkAsRead(BaseModel):
    is_read: bool

# Dashboard schemas
class DoctorDashboardResponse(BaseModel):
    total_cases: int
    cases_this_month: int
    active_alerts: int
    recent_cases: List[DiseaseCaseResponse]
    high_risk_districts: List[dict]

class AdminDashboardResponse(BaseModel):
    total_users: int
    total_cases: int
    total_alerts: int
    active_doctors: int
    model_accuracy: float
    last_training_date: Optional[date] = None

class SocietyDashboardResponse(BaseModel):
    high_risk_districts: List[dict]
    disease_statistics: dict
    population_affected: int
    recent_alerts: List[AlertResponse]

# Taluk schemas
class TalukResponse(BaseModel):
    id: int
    name: str
    district_id: int
    population: Optional[int] = None
    
    class Config:
        from_attributes = True

# Bulk upload schema
class BulkCaseUpload(BaseModel):
    cases: List[DiseaseCaseCreate]

class BulkUploadResponse(BaseModel):
    total_uploaded: int
    failed_count: int
    errors: List[str]

# ML Model schemas
class MLModelResponse(BaseModel):
    id: int
    model_name: str
    model_version: str
    training_date: Optional[date] = None
    accuracy: Optional[float] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ModelRetrainingRequest(BaseModel):
    include_all_data: bool = True

class ModelRetrainingResponse(BaseModel):
    success: bool
    accuracy: float
    message: str
