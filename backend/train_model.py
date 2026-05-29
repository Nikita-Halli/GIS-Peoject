"""
train_model.py
Run once from the backend/ folder:
    py -3.11 -m python train_model.py

Trains a regressor (case count) + classifier (risk level) on
dharwad_dengue_climate_dataset.csv and saves 5 artefacts to backend/models/.
"""

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent          # backend/
MODEL_DIR  = BASE_DIR / "models"
CSV_PATH   = BASE_DIR.parent / "dharwad_dengue_climate_dataset.csv"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

print(f"Looking for dataset at: {CSV_PATH}")
if not CSV_PATH.exists():
    print("ERROR: dharwad_dengue_climate_dataset.csv not found.")
    print("Make sure it is in the project root (next to backend/).")
    sys.exit(1)

# ── Load data ──────────────────────────────────────────────────────────────
df = pd.read_csv(CSV_PATH)
print(f"Loaded {len(df)} rows, columns: {list(df.columns)}")

# ── Normalise column names (lowercase + strip) ─────────────────────────────
df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
print(f"Normalised columns: {list(df.columns)}")

# ── Feature columns (must match what prediction.py sends) ─────────────────
FEATURE_COLS = [
    "month",
    "rainfall_mm",
    "avg_temp_c",
    "max_temp_c",
    "min_temp_c",
    "humidity_pct",
    "rainy_days",
    "stagnant_water_index",
    "mosquito_density_index",
    "prev_month_cases",
]

TARGET_CASES = "dengue_cases"   # regression target
TARGET_RISK  = "risk_level"     # classification target (Low/Medium/High)

# ── Verify required columns exist ─────────────────────────────────────────
missing = [c for c in FEATURE_COLS + [TARGET_CASES] if c not in df.columns]
if missing:
    print(f"ERROR: Missing columns in CSV: {missing}")
    print(f"Available columns: {list(df.columns)}")
    sys.exit(1)

# ── Build risk_level if not present ───────────────────────────────────────
if TARGET_RISK not in df.columns:
    print("risk_level column not found — generating from dengue_cases ...")
    def make_risk(cases):
        if cases >= 70:   return "High"
        if cases >= 25:   return "Medium"
        return "Low"
    df[TARGET_RISK] = df[TARGET_CASES].apply(make_risk)

print("Risk distribution:\n", df[TARGET_RISK].value_counts())

# ── Prepare X / y ─────────────────────────────────────────────────────────
X = df[FEATURE_COLS].copy()

# Fill any NaN with column median
for col in X.columns:
    if X[col].isnull().any():
        X[col].fillna(X[col].median(), inplace=True)

y_cases = df[TARGET_CASES].values.astype(float)

le = LabelEncoder()
y_risk = le.fit_transform(df[TARGET_RISK].values)

print(f"\nFeature matrix shape : {X.shape}")
print(f"Risk classes          : {le.classes_}")

# ── Train regressor ────────────────────────────────────────────────────────
print("\nTraining regressor ...")
reg = GradientBoostingRegressor(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    min_samples_leaf=2,
    random_state=42,
)
reg.fit(X, y_cases)

y_pred   = reg.predict(X)
mae      = float(np.mean(np.abs(y_pred - y_cases)))
rmse     = float(np.sqrt(np.mean((y_pred - y_cases) ** 2)))
r2       = float(reg.score(X, y_cases))
cv_r2    = float(np.mean(cross_val_score(reg, X, y_cases, cv=5, scoring="r2")))

print(f"  R²={r2:.4f}  CV-R²={cv_r2:.4f}  MAE=±{mae:.2f}  RMSE={rmse:.2f}")

# ── Train classifier ───────────────────────────────────────────────────────
print("Training classifier ...")
clf = GradientBoostingClassifier(
    n_estimators=300,
    max_depth=3,
    learning_rate=0.05,
    random_state=42,
)
clf.fit(X, y_risk)

acc    = float(clf.score(X, y_risk))
cv_acc = float(np.mean(cross_val_score(clf, X, y_risk, cv=5, scoring="accuracy")))
print(f"  Accuracy={acc:.4f}  CV-Accuracy={cv_acc:.4f}")

# ── Feature importances ────────────────────────────────────────────────────
importances = {
    col: round(float(imp), 6)
    for col, imp in zip(FEATURE_COLS, reg.feature_importances_)
}

# ── Save artefacts ─────────────────────────────────────────────────────────
joblib.dump(reg,          MODEL_DIR / "dengue_regressor.pkl")
joblib.dump(clf,          MODEL_DIR / "dengue_classifier.pkl")
joblib.dump(FEATURE_COLS, MODEL_DIR / "feature_columns.pkl")
joblib.dump(le,           MODEL_DIR / "label_encoder.pkl")

metrics = {
    "regressor":  {"mae": round(mae,2), "rmse": round(rmse,2), "r2": round(r2,4), "cv_r2": round(cv_r2,4)},
    "classifier": {"accuracy": round(acc,4), "cv_accuracy": round(cv_acc,4)},
    "feature_importances": importances,
    "training_rows": len(df),
    "risk_classes": list(le.classes_),
}
with open(MODEL_DIR / "model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\nAll 5 artefacts saved to {MODEL_DIR}")
print("Training complete!")