import pickle
import json
import logging
import numpy as np
import pandas as pd
from datetime import date
from pathlib import Path
from typing import Tuple, Dict, Any
from xgboost import XGBRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sqlalchemy.orm import Session
from models import DiseaseCase, RiskPrediction, MLModel, District, Taluk
from database import SessionLocal
import os

logger = logging.getLogger(__name__)

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

class DiseaseRiskPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = [
            'case_count_7d', 'case_count_14d', 'case_count_30d',
            'avg_severity_score', 'population_density',
            'previous_risk_score', 'trend_indicator'
        ]
        self.model_version = "1.0.0"
    
    def extract_features(self, db: Session, district_id: int, disease_type: str, taluk_id: int = None) -> np.ndarray:
        """Extract features for a specific district/taluk"""
        from datetime import datetime, timedelta
        
        today = date.today()
        
        # Case counts in different time windows
        case_7d = db.query(DiseaseCase).filter(
            DiseaseCase.disease_type == disease_type,
            DiseaseCase.case_date >= (today - timedelta(days=7))
        ).count()
        
        case_14d = db.query(DiseaseCase).filter(
            DiseaseCase.disease_type == disease_type,
            DiseaseCase.case_date >= (today - timedelta(days=14))
        ).count()
        
        case_30d = db.query(DiseaseCase).filter(
            DiseaseCase.disease_type == disease_type,
            DiseaseCase.case_date >= (today - timedelta(days=30))
        ).count()
        
        # Average severity score
        severity_map = {'mild': 1, 'moderate': 2, 'severe': 3}
        severity_scores = db.query(DiseaseCase).filter(
            DiseaseCase.disease_type == disease_type,
            DiseaseCase.case_date >= (today - timedelta(days=30))
        ).all()
        
        avg_severity = np.mean([severity_map.get(case.severity, 1) for case in severity_scores]) if severity_scores else 1
        
        # Population density
        district = db.query(District).filter(District.id == district_id).first()
        population_density = (district.population / float(district.area)) if district and district.area else 100
        
        # Previous risk score
        previous_risk = db.query(RiskPrediction).filter(
            RiskPrediction.district_id == district_id,
            RiskPrediction.disease_type == disease_type
        ).order_by(RiskPrediction.prediction_date.desc()).first()
        previous_risk_score = float(previous_risk.risk_score) if previous_risk else 25
        
        # Trend indicator
        trend_indicator = 1 if case_7d > case_14d / 2 else 0
        
        features = np.array([
            case_7d, case_14d, case_30d,
            avg_severity, population_density,
            previous_risk_score, trend_indicator
        ]).reshape(1, -1)
        
        return features
    
    def train(self, db: Session) -> Tuple[float, str]:
        """Train the XGBoost model on historical data"""
        try:
            # Prepare training data
            disease_cases = db.query(DiseaseCase).all()
            
            if len(disease_cases) < 10:
                logger.warning("Insufficient data for training")
                return 0.0, "insufficient_data"
            
            # Create synthetic training data
            X_list = []
            y_list = []
            
            for district in db.query(District).all():
                for disease in ['Dengue', 'Malaria', 'Typhoid', 'COVID-19']:
                    features = self.extract_features(db, district.id, disease)
                    risk_prediction = db.query(RiskPrediction).filter(
                        RiskPrediction.district_id == district.id,
                        RiskPrediction.disease_type == disease
                    ).order_by(RiskPrediction.prediction_date.desc()).first()
                    
                    if risk_prediction:
                        X_list.append(features[0])
                        y_list.append(float(risk_prediction.risk_score))
            
            if not X_list:
                logger.warning("No training data available")
                return 0.0, "no_training_data"
            
            X = np.array(X_list)
            y = np.array(y_list)
            
            # Train model
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)
            
            self.model = XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
                objective='reg:squarederror'
            )
            
            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
            self.model.fit(X_train, y_train)
            
            # Calculate accuracy (R-squared score)
            accuracy = self.model.score(X_test, y_test)
            
            # Save model
            model_path = MODELS_DIR / f"disease_risk_model_{self.model_version}.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump({'model': self.model, 'scaler': self.scaler}, f)
            
            # Save model metadata to database
            ml_model = MLModel(
                model_name="XGBoost Disease Risk Predictor",
                model_version=self.model_version,
                model_path=str(model_path),
                training_date=date.today(),
                accuracy=float(accuracy),
                features=self.feature_names,
                is_active=True
            )
            db.add(ml_model)
            db.commit()
            
            logger.info(f"Model trained successfully. Accuracy: {accuracy:.4f}")
            return float(accuracy), "success"
        
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return 0.0, str(e)
    
    def predict(self, db: Session, district_id: int, disease_type: str, taluk_id: int = None) -> float:
        """Predict risk score for a district/disease combination"""
        try:
            if self.model is None:
                self.load_model()
            
            features = self.extract_features(db, district_id, disease_type, taluk_id)
            features_scaled = self.scaler.transform(features)
            risk_score = float(self.model.predict(features_scaled)[0])
            
            # Clamp between 0 and 100
            risk_score = max(0, min(100, risk_score))
            
            return risk_score
        except Exception as e:
            logger.error(f"Error predicting risk: {e}")
            return 25.0  # Default moderate risk
    
    def load_model(self):
        """Load trained model from disk"""
        model_path = MODELS_DIR / f"disease_risk_model_{self.model_version}.pkl"
        if model_path.exists():
            with open(model_path, 'rb') as f:
                data = pickle.load(f)
                self.model = data['model']
                self.scaler = data['scaler']
            logger.info("Model loaded successfully")
        else:
            logger.warning("Model file not found, training new model")

# Global predictor instance
predictor = DiseaseRiskPredictor()

def update_risk_predictions(db: Session, disease_types: list = None):
    """Update risk predictions for all districts"""
    if disease_types is None:
        disease_types = ['Dengue', 'Malaria', 'Typhoid', 'COVID-19']
    
    try:
        if predictor.model is None:
            predictor.train(db)
        
        districts = db.query(District).all()
        today = date.today()
        
        for district in districts:
            for disease in disease_types:
                risk_score = predictor.predict(db, district.id, disease)
                
                # Check if prediction already exists for today
                existing = db.query(RiskPrediction).filter(
                    RiskPrediction.district_id == district.id,
                    RiskPrediction.disease_type == disease,
                    RiskPrediction.prediction_date == today
                ).first()
                
                if existing:
                    existing.risk_score = risk_score
                else:
                    prediction = RiskPrediction(
                        district_id=district.id,
                        disease_type=disease,
                        risk_score=risk_score,
                        prediction_date=today,
                        model_version=predictor.model_version,
                        factors={
                            'case_count': db.query(DiseaseCase).filter(
                                DiseaseCase.disease_type == disease
                            ).count()
                        }
                    )
                    db.add(prediction)
        
        db.commit()
        logger.info("Risk predictions updated successfully")
    except Exception as e:
        logger.error(f"Error updating predictions: {e}")
        db.rollback()
