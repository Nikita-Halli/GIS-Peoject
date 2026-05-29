import pandas as pd
from pathlib import Path

CSV_PATH = Path(r"C:\Users\3FIN\Downloads\disease-prediction-system-2\Minor2\maping\scripts\mapped_dengue_cases.csv")

def get_map_cases():
    df = pd.read_csv(CSV_PATH)

    df = df.fillna("")

    patients = []

    for _, row in df.iterrows():
        patients.append({
            "patient_name": row.get("patient_name", ""),
            "age": row.get("age", ""),
            "sex": row.get("sex", ""),
            "taluka": row.get("taluka", ""),
            "district": row.get("district", ""),
            "latitude": row.get("latitude", ""),
            "longitude": row.get("longitude", ""),
        })

    return patients