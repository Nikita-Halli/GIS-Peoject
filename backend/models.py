from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Numeric, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # doctor, admin, society
    phone = Column(String(20))
    organization = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    disease_cases = relationship("DiseaseCase", back_populates="doctor")
    alerts = relationship("Alert", back_populates="user")

class District(Base):
    __tablename__ = "districts"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    state = Column(String(255), default="Karnataka")
    population = Column(Integer)
    area = Column(Numeric)
    geometry = Column(Geometry("POLYGON", srid=4326))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    taluks = relationship("Taluk", back_populates="district")
    risk_predictions = relationship("RiskPrediction", back_populates="district")

class Taluk(Base):
    __tablename__ = "taluks"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    population = Column(Integer)
    geometry = Column(Geometry("POLYGON", srid=4326))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    district = relationship("District", back_populates="taluks")
    risk_predictions = relationship("RiskPrediction", back_populates="taluk")

class DiseaseCase(Base):
    __tablename__ = "disease_cases"
    
    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_name = Column(String(255), nullable=False)
    patient_age = Column(Integer)
    patient_gender = Column(String(10))
    disease_type = Column(String(100), nullable=False)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    case_date = Column(Date, nullable=False)
    severity = Column(String(20))  # mild, moderate, severe
    location_geometry = Column(Geometry("POINT", srid=4326))
    symptoms = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    doctor = relationship("User", back_populates="disease_cases")

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"
    
    id = Column(Integer, primary_key=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    taluk_id = Column(Integer, ForeignKey("taluks.id"))
    disease_type = Column(String(100), nullable=False)
    risk_score = Column(Numeric(5, 2), nullable=False)
    confidence = Column(Numeric(5, 2))
    prediction_date = Column(Date, nullable=False)
    model_version = Column(String(50))
    factors = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    district = relationship("District", back_populates="risk_predictions")
    taluk = relationship("Taluk", back_populates="risk_predictions")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    related_district_id = Column(Integer, ForeignKey("districts.id"))
    risk_level = Column(String(20))  # low, medium, high, critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="alerts")

class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True)
    model_name = Column(String(255), nullable=False)
    model_version = Column(String(50), unique=True, nullable=False)
    model_path = Column(String(500))
    training_date = Column(Date)
    accuracy = Column(Numeric(5, 2))
    features = Column(JSON)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
