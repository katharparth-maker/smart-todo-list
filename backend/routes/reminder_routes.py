from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from services.auth_service import get_current_user
from services import reminder_service


class ReminderCreate(BaseModel):
    task_id: Optional[str] = None
    title: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    remind_at: Optional[str] = None
    message: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"

    model_config = ConfigDict(extra="ignore")


class ReminderUpdate(BaseModel):
    task_id: Optional[str] = None
    title: Optional[str] = None
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    remind_at: Optional[str] = None
    message: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get(
    "",
    response_model=List[Dict[str, Any]],
    summary="List reminders",
    description="Retrieve all reminders belonging to the authenticated user.",
    responses={
        200: {"description": "List of user reminders"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
    },
)
@router.get("/", response_model=List[Dict[str, Any]], include_in_schema=False)
def list_reminders(current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    return reminder_service.get_reminders_for_user(user_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a reminder",
    description="Create a new reminder for a task or standalone date.",
    responses={
        201: {"description": "Reminder created successfully"},
        400: {"description": "Task not found or does not belong to user"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        422: {"description": "Validation error in request body"},
        500: {"description": "Server error during reminder creation"},
    },
)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_reminder(
    reminder_in: ReminderCreate, current_user=Depends(get_current_user)
):
    user_id = getattr(current_user, "id", None)

    if reminder_in.task_id:
        valid_task = reminder_service.validate_task_ownership(
            reminder_in.task_id, user_id
        )
        if not valid_task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task not found or does not belong to user",
            )

    reminder_data = reminder_in.model_dump(exclude_unset=True)
    return reminder_service.create_reminder_for_user(user_id, reminder_data)


@router.get(
    "/{reminder_id}",
    summary="Get reminder by ID",
    description="Retrieve details of a specific reminder belonging to the authenticated user.",
    responses={
        200: {"description": "Reminder details"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        404: {"description": "Reminder not found"},
    },
)
def get_reminder(reminder_id: str, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    reminder = reminder_service.get_reminder_by_id_for_user(reminder_id, user_id)
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )
    return reminder


@router.put(
    "/{reminder_id}",
    summary="Update a reminder",
    description="Update an existing reminder belonging to the authenticated user.",
    responses={
        200: {"description": "Updated reminder object"},
        400: {"description": "Task not found or invalid update payload"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        404: {"description": "Reminder not found"},
        422: {"description": "Validation error"},
        500: {"description": "Server error during reminder update"},
    },
)
def update_reminder(
    reminder_id: str,
    reminder_in: ReminderUpdate,
    current_user=Depends(get_current_user),
):
    user_id = getattr(current_user, "id", None)

    if reminder_in.task_id:
        valid_task = reminder_service.validate_task_ownership(
            reminder_in.task_id, user_id
        )
        if not valid_task:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task not found or does not belong to user",
            )

    update_data = reminder_in.model_dump(exclude_unset=True)
    updated_reminder = reminder_service.update_reminder_for_user(
        reminder_id, user_id, update_data
    )
    if not updated_reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )
    return updated_reminder


@router.delete(
    "/{reminder_id}",
    summary="Delete a reminder",
    description="Delete a reminder by ID for the authenticated user.",
    responses={
        200: {"description": "Reminder deleted successfully"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        404: {"description": "Reminder not found"},
        500: {"description": "Server error during reminder deletion"},
    },
)
def delete_reminder(reminder_id: str, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    deleted_reminder = reminder_service.delete_reminder_for_user(reminder_id, user_id)
    if not deleted_reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )
    return {"message": "Reminder deleted successfully", "id": reminder_id}
