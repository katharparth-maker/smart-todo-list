from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from services.auth_service import get_current_user
from services import planner_service


def is_end_after_start(start_str: str, end_str: str) -> bool:
    try:
        start_dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
        return end_dt > start_dt
    except Exception:
        return end_str > start_str


class PlannerCreate(BaseModel):
    task_id: Optional[str] = None
    title: Optional[str] = None
    start_time: str
    end_time: str
    status: Optional[str] = "scheduled"

    model_config = ConfigDict(extra="ignore")


class PlannerUpdate(BaseModel):
    task_id: Optional[str] = None
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


router = APIRouter(prefix="/planner", tags=["planner"])


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]], include_in_schema=False)
def list_planner_entries(current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    return planner_service.get_planner_entries_for_user(user_id)


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_planner_entry(
    planner_in: PlannerCreate, current_user=Depends(get_current_user)
):
    user_id = getattr(current_user, "id", None)

    if not is_end_after_start(planner_in.start_time, planner_in.end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be later than start_time",
        )

    planner_data = planner_in.model_dump(exclude_unset=True)
    return planner_service.create_planner_entry_for_user(user_id, planner_data)


@router.get("/{planner_id}")
def get_planner_entry(planner_id: str, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    entry = planner_service.get_planner_entry_by_id_for_user(planner_id, user_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planner entry not found",
        )
    return entry


@router.put("/{planner_id}")
def update_planner_entry(
    planner_id: str,
    planner_in: PlannerUpdate,
    current_user=Depends(get_current_user),
):
    user_id = getattr(current_user, "id", None)
    existing = planner_service.get_planner_entry_by_id_for_user(planner_id, user_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planner entry not found",
        )

    update_data = planner_in.model_dump(exclude_unset=True)

    start_time = update_data.get("start_time", existing.get("start_time"))
    end_time = update_data.get("end_time", existing.get("end_time"))

    if start_time and end_time and not is_end_after_start(start_time, end_time):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be later than start_time",
        )

    updated_entry = planner_service.update_planner_entry_for_user(
        planner_id, user_id, update_data
    )
    return updated_entry


@router.delete("/{planner_id}")
def delete_planner_entry(planner_id: str, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    deleted_entry = planner_service.delete_planner_entry_for_user(planner_id, user_id)
    if not deleted_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planner entry not found",
        )
    return {"message": "Planner entry deleted successfully", "id": planner_id}
