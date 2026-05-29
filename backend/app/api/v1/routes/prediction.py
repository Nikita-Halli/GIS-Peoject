"""
backend/app/api/v1/routes/prediction.py

Routes:
  POST  /api/v1/predict/dengue    → run ML prediction
  GET   /api/v1/predict/metrics   → model accuracy stats
  GET   /api/v1/predict/defaults  → climate defaults for a given month
"""

import json
from pathlib import Path
from typing import Dict

import joblib
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/predict", tags=["Prediction"])

# ── Path resolution ────────────────────────────────────────────────────────
# prediction.py  →  routes/  →  v1/  →  api/  →  app/  →  backend/
BASE_DIR  = Path(__file__).resolve().parents[4]   # → backend/
MODEL_DIR = BASE_DIR / "models"

# ── Lazy model cache ───────────────────────────────────────────────────────
_models: Dict = {}


def load_models():
    """Load models from disk on first request, then cache in memory."""
    if _models:
        return _models

    required = [
        "dengue_regressor.pkl",
        "dengue_classifier.pkl",
        "feature_columns.pkl",
        "label_encoder.pkl",
    ]
    missing = [f for f in required if not (MODEL_DIR / f).exists()]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Model files not found: {missing}. "
                "Run 'py -3.11 -m python train_model.py' from the backend/ folder first."
            ),
        )

    _models["regressor"]       = joblib.load(MODEL_DIR / "dengue_regressor.pkl")
    _models["classifier"]      = joblib.load(MODEL_DIR / "dengue_classifier.pkl")
    _models["feature_columns"] = joblib.load(MODEL_DIR / "feature_columns.pkl")
    _models["label_encoder"]   = joblib.load(MODEL_DIR / "label_encoder.pkl")
    return _models


# ── Pydantic schema ────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    month:                  int   = Field(..., ge=1, le=12)
    rainfall_mm:            float = Field(..., ge=0)
    avg_temp_c:             float
    max_temp_c:             float
    min_temp_c:             float
    humidity_pct:           float = Field(..., ge=0, le=100)
    rainy_days:             int   = Field(..., ge=0, le=31)
    stagnant_water_index:   float = Field(..., ge=0, le=10)
    mosquito_density_index: float = Field(..., ge=0, le=10)
    prev_month_cases:       int   = Field(..., ge=0)


# ── Dharwad monthly climate defaults ──────────────────────────────────────
# Source: KSNDMC / UAS Dharwad MARS station 1991-2024 + Weather Atlas
_DEFAULTS = {
    1:  {"rainfall_mm":   2, "avg_temp_c": 22.0, "max_temp_c": 30.0, "min_temp_c": 14.0, "humidity_pct": 52, "rainy_days":  1, "stagnant_water_index": 1.0, "mosquito_density_index": 1.0},
    2:  {"rainfall_mm":   0, "avg_temp_c": 24.5, "max_temp_c": 33.0, "min_temp_c": 15.0, "humidity_pct": 40, "rainy_days":  0, "stagnant_water_index": 0.5, "mosquito_density_index": 0.5},
    3:  {"rainfall_mm":   8, "avg_temp_c": 27.0, "max_temp_c": 36.0, "min_temp_c": 17.0, "humidity_pct": 42, "rainy_days":  2, "stagnant_water_index": 1.0, "mosquito_density_index": 1.0},
    4:  {"rainfall_mm":  19, "avg_temp_c": 29.5, "max_temp_c": 38.0, "min_temp_c": 20.0, "humidity_pct": 48, "rainy_days":  3, "stagnant_water_index": 2.0, "mosquito_density_index": 2.0},
    5:  {"rainfall_mm":  53, "avg_temp_c": 28.0, "max_temp_c": 36.0, "min_temp_c": 21.0, "humidity_pct": 60, "rainy_days":  6, "stagnant_water_index": 3.0, "mosquito_density_index": 3.0},
    6:  {"rainfall_mm": 100, "avg_temp_c": 25.0, "max_temp_c": 30.0, "min_temp_c": 20.0, "humidity_pct": 78, "rainy_days": 14, "stagnant_water_index": 5.0, "mosquito_density_index": 5.0},
    7:  {"rainfall_mm": 189, "avg_temp_c": 23.5, "max_temp_c": 28.0, "min_temp_c": 20.0, "humidity_pct": 91, "rainy_days": 22, "stagnant_water_index": 8.0, "mosquito_density_index": 8.0},
    8:  {"rainfall_mm": 161, "avg_temp_c": 24.0, "max_temp_c": 28.5, "min_temp_c": 20.5, "humidity_pct": 88, "rainy_days": 20, "stagnant_water_index": 8.0, "mosquito_density_index": 7.5},
    9:  {"rainfall_mm": 126, "avg_temp_c": 24.5, "max_temp_c": 29.0, "min_temp_c": 20.0, "humidity_pct": 82, "rainy_days": 15, "stagnant_water_index": 7.0, "mosquito_density_index": 7.0},
    10: {"rainfall_mm":  64, "avg_temp_c": 24.0, "max_temp_c": 30.0, "min_temp_c": 19.0, "humidity_pct": 72, "rainy_days":  9, "stagnant_water_index": 5.0, "mosquito_density_index": 5.0},
    11: {"rainfall_mm":  19, "avg_temp_c": 22.5, "max_temp_c": 30.0, "min_temp_c": 16.0, "humidity_pct": 62, "rainy_days":  3, "stagnant_water_index": 2.5, "mosquito_density_index": 2.5},
    12: {"rainfall_mm":   1, "avg_temp_c": 21.0, "max_temp_c": 29.0, "min_temp_c": 14.0, "humidity_pct": 52, "rainy_days":  1, "stagnant_water_index": 1.0, "mosquito_density_index": 1.0},
}

_PREVENTION_TIPS = {
    "High": [
        "Activate emergency dengue response teams immediately.",
        "Deploy fogging and larviciding across all high-density areas.",
        "Open additional hospital beds and dengue wards.",
        "Issue public health advisory — avoid stagnant water accumulation.",
        "Conduct daily surveillance of fever cases in all PHCs.",
        "Distribute mosquito nets and repellents to vulnerable households.",
    ],
    "Medium": [
        "Increase community awareness campaigns on dengue prevention.",
        "Conduct weekly inspection of water storage containers.",
        "Ensure drainage systems are clear and flowing.",
        "Encourage use of mosquito repellents during peak hours (dawn/dusk).",
        "Monitor fever cases closely at PHCs and report clusters.",
    ],
    "Low": [
        "Maintain routine vector control and surveillance activities.",
        "Educate communities to eliminate standing water around homes.",
        "Ensure proper disposal of waste tyres, cans, and containers.",
        "Continue monthly larviciding in known breeding hotspots.",
    ],
}


# ── POST /api/v1/predict/dengue ────────────────────────────────────────────
@router.post("/dengue")
async def predict_dengue(body: PredictRequest):
    m = load_models()

    reg  = m["regressor"]
    clf  = m["classifier"]
    cols = m["feature_columns"]
    le   = m["label_encoder"]

    # Build feature vector in the same order the model was trained on
    features = np.array([[
        body.month,
        body.rainfall_mm,
        body.avg_temp_c,
        body.max_temp_c,
        body.min_temp_c,
        body.humidity_pct,
        body.rainy_days,
        body.stagnant_water_index,
        body.mosquito_density_index,
        body.prev_month_cases,
    ]])

    # Regression — predicted case count (never negative)
    predicted_cases = max(0, int(round(float(reg.predict(features)[0]))))

    # Classification — risk level
    risk_idx   = int(clf.predict(features)[0])
    risk_level = str(le.inverse_transform([risk_idx])[0])

    # Probability breakdown
    proba      = clf.predict_proba(features)[0]
    risk_proba = {
        str(le.inverse_transform([i])[0]): round(float(p), 4)
        for i, p in enumerate(proba)
    }

    # Confidence = probability of the predicted class
    confidence = round(float(proba[risk_idx]), 4)

    # Human-readable interpretation
    month_name = [
        "", "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ][body.month]

    interpretation = (
        f"For {month_name} with {body.rainfall_mm:.0f} mm rainfall and "
        f"{body.humidity_pct:.0f}% humidity, the model predicts "
        f"{predicted_cases} dengue cases with {risk_level.lower()} outbreak risk "
        f"({confidence*100:.1f}% confidence)."
    )

    # Load R² from saved metrics
    metrics_path = MODEL_DIR / "model_metrics.json"
    model_r2 = 0.0
    if metrics_path.exists():
        with open(metrics_path) as f:
            model_r2 = json.load(f).get("regressor", {}).get("r2", 0.0)

    return {
        "predicted_cases":   predicted_cases,
        "risk_level":        risk_level,
        "risk_probability":  risk_proba,
        "confidence":        confidence,
        "interpretation":    interpretation,
        "prevention_tips":   _PREVENTION_TIPS.get(risk_level, _PREVENTION_TIPS["Low"]),
        "model_r2":          model_r2,
    }


# ── GET /api/v1/predict/metrics ────────────────────────────────────────────
@router.get("/metrics")
async def get_metrics():
    metrics_path = MODEL_DIR / "model_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(
            status_code=404,
            detail="model_metrics.json not found. Run train_model.py first.",
        )
    with open(metrics_path) as f:
        return json.load(f)


# ── GET /api/v1/predict/defaults ──────────────────────────────────────────
@router.get("/defaults")
async def get_defaults(month: int = 1):
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="month must be 1–12")
    return _DEFAULTS[month]