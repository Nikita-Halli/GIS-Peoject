from fastapi import APIRouter
from app.services.map_service import get_map_cases

router = APIRouter()

@router.get("/users")
def get_users():
    patients = get_map_cases()

    users = []

    for p in patients:
        users.append({
            "name": p["name"],
            "email": f"{p['name'].strip().replace(' ', '').lower()}@health.local",
            "role": "patient",
            "organization": p["district"],
            "status": "Active"
        })

    return users