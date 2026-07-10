"""
Dharwad Dengue Prediction Model — Final Version
================================================
Training data: 72 monthly records (2019-2024)
  - 2019-2020: District-level estimates from KSNDMC climate data
  - 2021-2024: Real patient counts from 592 admission records
  + Climate: KSNDMC + UAS Dharwad MARS station

This hybrid approach gives the model enough High-risk examples
(2019-2020 outbreak months) to learn outbreak patterns,
while incorporating real 2021-2024 patient data.
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    classification_report, accuracy_score
)

BASE_DIR  = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "dharwad_dengue_climate_dataset.csv"
if not DATA_PATH.exists():
    DATA_PATH = BASE_DIR.parent / "dharwad_dengue_climate_dataset.csv"

MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

print(f"Loading: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"Dataset: {len(df)} rows, {df['dengue_cases'].sum()} total cases")

print(f"\nYearly summary:")
for yr, grp in df.groupby("year"):
    src = "Real patient data" if yr >= 2021 else "KSNDMC estimates"
    print(f"  {yr}: {grp['dengue_cases'].sum():4d} cases, "
          f"peak={grp['dengue_cases'].max():4d} ({src})")

print(f"\nRisk distribution:")
print(df["risk_level"].value_counts())

FEATURES = [
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

X     = df[FEATURES].copy()
y_reg = df["dengue_cases"].copy()
y_cls = df["risk_level"].copy()

le = LabelEncoder()
le.fit(["Low", "Medium", "High"])
y_cls_enc = le.transform(y_cls)

print(f"\nClasses: {le.classes_}")
print(f"Case stats: min={y_reg.min()}, max={y_reg.max()}, "
      f"mean={y_reg.mean():.1f}, median={y_reg.median():.1f}")

# Train/test split
X_train, X_test, yr_train, yr_test = train_test_split(
    X, y_reg, test_size=0.2, random_state=42
)
_, _, yc_train, yc_test = train_test_split(
    X, y_cls_enc, test_size=0.2, random_state=42
)

print(f"\nTrain: {len(X_train)}, Test: {len(X_test)}")

# Regressor
print("\nTraining RandomForestRegressor...")
reg = RandomForestRegressor(
    n_estimators=300,
    max_depth=10,
    min_samples_split=3,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1
)
reg.fit(X_train, yr_train)
yr_pred = reg.predict(X_test)

mae   = mean_absolute_error(yr_test, yr_pred)
rmse  = np.sqrt(mean_squared_error(yr_test, yr_pred))
r2    = r2_score(yr_test, yr_pred)
cv_r2 = cross_val_score(reg, X, y_reg, cv=5, scoring="r2").mean()

print(f"\n=== Regressor ===")
print(f"  MAE          : {mae:.2f} cases")
print(f"  RMSE         : {rmse:.2f} cases")
print(f"  R²           : {r2:.4f}")
print(f"  CV R² 5-fold : {cv_r2:.4f}")

print(f"\nPredictions vs Actual (test set):")
for actual, predicted in zip(yr_test, yr_pred):
    status = "✓" if abs(actual - round(predicted)) <= 10 else "~"
    print(f"  {status} Actual: {int(actual):4d}  "
          f"Predicted: {int(round(predicted)):4d}  "
          f"Diff: {abs(actual - round(predicted)):.0f}")

# Classifier
print("\nTraining RandomForestClassifier...")
clf = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    min_samples_split=3,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)
clf.fit(X_train, yc_train)
yc_pred = clf.predict(X_test)

acc    = accuracy_score(yc_test, yc_pred)
cv_acc = cross_val_score(clf, X, y_cls_enc, cv=5, scoring="accuracy").mean()

print(f"\n=== Classifier ===")
print(f"  Accuracy         : {acc:.4f}")
print(f"  CV Accuracy 5-fold: {cv_acc:.4f}")
print(classification_report(
    yc_test, yc_pred,
    target_names=le.classes_,
    zero_division=0
))

importances = dict(zip(FEATURES, reg.feature_importances_.tolist()))
print("Feature Importances:")
for k, v in sorted(importances.items(), key=lambda x: -x[1]):
    bar = "█" * int(v * 50)
    print(f"  {k:30s}: {v:.4f}  {bar}")

# Save
joblib.dump(reg,      MODEL_DIR / "dengue_regressor.pkl")
joblib.dump(clf,      MODEL_DIR / "dengue_classifier.pkl")
joblib.dump(FEATURES, MODEL_DIR / "feature_columns.pkl")
joblib.dump(le,       MODEL_DIR / "label_encoder.pkl")

metrics = {
    "regressor": {
        "mae":   round(float(mae),  2),
        "rmse":  round(float(rmse), 2),
        "r2":    round(float(r2),   4),
        "cv_r2": round(float(cv_r2),4),
    },
    "classifier": {
        "accuracy":    round(float(acc),    4),
        "cv_accuracy": round(float(cv_acc), 4),
    },
    "feature_importances": {
        k: round(float(v), 4) for k, v in importances.items()
    },
    "features":       FEATURES,
    "risk_classes":   le.classes_.tolist(),
    "training_rows":  len(df),
    "total_patients": 592,
    "data_years":     "2019-2024",
    "data_source": (
        "Hybrid dataset: KSNDMC district estimates (2019-2020) + "
        "real patient admission records (2021-2024) + "
        "UAS Dharwad MARS station climate data"
    ),
}

with open(MODEL_DIR / "model_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\n✅ Models saved!")
print(f"\n📊 Final Summary:")
print(f"   Training rows  : {len(df)}")
print(f"   Real patients  : 592 (2021-2024)")
print(f"   Estimate rows  : 24 (2019-2020, KSNDMC)")
print(f"   R²             : {r2:.4f}")
print(f"   CV R² (5-fold) : {cv_r2:.4f}")
print(f"   MAE            : ±{mae:.2f} cases")
print(f"   Classifier Acc : {acc:.4f}")
print(f"   CV Accuracy    : {cv_acc:.4f}")