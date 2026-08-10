from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from services.auth_service import get_current_user
from services import task_service


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    due_date: Optional[str] = None
    category: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    category: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get(
    "",
    response_model=List[Dict[str, Any]],
    summary="List tasks",
    description="Retrieve all tasks belonging to the authenticated user.",
    responses={
        200: {"description": "List of user tasks"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
    },
)
@router.get("/", response_model=List[Dict[str, Any]], include_in_schema=False)
def list_tasks(current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    return task_service.get_tasks_for_user(user_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create a task",
    description="Create a new task for the authenticated user.",
    responses={
        201: {"description": "Task created successfully"},
        400: {"description": "Invalid request payload"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        422: {"description": "Validation error in request body"},
        500: {"description": "Server error during task creation"},
    },
)
@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_task(task_in: TaskCreate, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    task_data = task_in.model_dump(exclude_unset=True)
    return task_service.create_task_for_user(user_id, task_data)


@router.get(
    "/{task_id}",
    summary="Get task by ID",
    description="Retrieve details of a specific task belonging to the authenticated user.",
    responses={
        200: {"description": "Task details"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        404: {"description": "Task not found"},
    },
)
def get_task(task_id: str, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    task = task_service.get_task_by_id_for_user(task_id, user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.put(
    "/{task_id}",
    summary="Update a task",
    description="Update fields of an existing task belonging to the authenticated user.",
    responses={
        200: {"description": "Updated task object"},
        400: {"description": "Invalid update data"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        404: {"description": "Task not found"},
        422: {"description": "Validation error"},
        500: {"description": "Server error during task update"},
    },
)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user=Depends(get_current_user),
):
    user_id = getattr(current_user, "id", None)
    update_data = task_in.model_dump(exclude_unset=True)
    updated_task = task_service.update_task_for_user(task_id, user_id, update_data)
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return updated_task


@router.delete(
    "/{task_id}",
    summary="Delete a task",
    description="Delete a task by ID for the authenticated user.",
    responses={
        200: {"description": "Task deleted successfully"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        404: {"description": "Task not found"},
        500: {"description": "Server error during task deletion"},
    },
)
def delete_task(task_id: str, current_user=Depends(get_current_user)):
    user_id = getattr(current_user, "id", None)
    deleted_task = task_service.delete_task_for_user(task_id, user_id)
    if not deleted_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return {"message": "Task deleted successfully", "id": task_id}
