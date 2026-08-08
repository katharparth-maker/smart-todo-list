from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from services.auth_service import get_current_user
from services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=Dict[str, Any])
@router.get("/", response_model=Dict[str, Any], include_in_schema=False)
def get_latest_analytics(current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    analytics = analytics_service.get_latest_analytics_for_user(user_id)
    if not analytics:
        return {}
    return analytics


@router.get("/today", response_model=Dict[str, Any])
@router.get("/today/", response_model=Dict[str, Any], include_in_schema=False)
def get_today_analytics(current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    return analytics_service.calculate_today_analytics_for_user(user_id)


@router.get("/weekly", response_model=List[Dict[str, Any]])
def get_weekly_analytics(current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    return analytics_service.get_weekly_analytics_for_user(user_id)
