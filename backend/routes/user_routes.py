from fastapi import APIRouter, Depends
from services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": getattr(current_user, "id", None),
        "email": getattr(current_user, "email", None),
    }
