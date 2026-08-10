from typing import Dict, Any, List, Optional
import logging
from fastapi import HTTPException, status
from services.supabase_service import supabase

logger = logging.getLogger(__name__)


def get_tasks_for_user(user_id: str) -> List[Dict[str, Any]]:
    try:
        response = supabase.table("tasks").select("*").eq("user_id", user_id).execute()
        return response.data or []
    except Exception as e:
        logger.error("Error fetching tasks for user %s: %s", user_id, e, exc_info=True)
        return []


def create_task_for_user(user_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        payload = {**task_data, "user_id": user_id}
        response = supabase.table("tasks").insert(payload).execute()
        return response.data[0] if response.data else {}
    except Exception as e:
        logger.error("Error creating task for user %s: %s", user_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task. Please try again.",
        )


def get_task_by_id_for_user(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    try:
        response = (
            supabase.table("tasks")
            .select("*")
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        logger.error("Error fetching task %s for user %s: %s", task_id, user_id, e, exc_info=True)
        return None


def update_task_for_user(
    task_id: str, user_id: str, update_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    existing = get_task_by_id_for_user(task_id, user_id)
    if not existing:
        return None

    filtered_payload = {k: v for k, v in update_data.items() if v is not None}
    if not filtered_payload:
        return existing

    try:
        response = (
            supabase.table("tasks")
            .update(filtered_payload)
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        logger.error("Error updating task %s for user %s: %s", task_id, user_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task. Please try again.",
        )


def delete_task_for_user(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    existing = get_task_by_id_for_user(task_id, user_id)
    if not existing:
        return None

    try:
        response = (
            supabase.table("tasks")
            .delete()
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        if response.data and len(response.data) > 0:
            return response.data[0]
        return existing
    except Exception as e:
        logger.error("Error deleting task %s for user %s: %s", task_id, user_id, e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete task. Please try again.",
        )

