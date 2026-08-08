from typing import Dict, Any, List, Optional
from services.supabase_service import supabase


def validate_task_ownership(task_id: str, user_id: str) -> bool:
    res = (
        supabase.table("tasks")
        .select("id")
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(res.data and len(res.data) > 0)


def get_reminders_for_user(user_id: str) -> List[Dict[str, Any]]:
    response = (
        supabase.table("reminders").select("*").eq("user_id", user_id).execute()
    )
    return response.data or []


def create_reminder_for_user(
    user_id: str, reminder_data: Dict[str, Any]
) -> Dict[str, Any]:
    payload = {**reminder_data, "user_id": user_id}
    response = supabase.table("reminders").insert(payload).execute()
    return response.data[0] if response.data else {}


def get_reminder_by_id_for_user(
    reminder_id: str, user_id: str
) -> Optional[Dict[str, Any]]:
    response = (
        supabase.table("reminders")
        .select("*")
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def update_reminder_for_user(
    reminder_id: str, user_id: str, update_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    existing = get_reminder_by_id_for_user(reminder_id, user_id)
    if not existing:
        return None

    filtered_payload = {k: v for k, v in update_data.items() if v is not None}
    if not filtered_payload:
        return existing

    response = (
        supabase.table("reminders")
        .update(filtered_payload)
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def delete_reminder_for_user(
    reminder_id: str, user_id: str
) -> Optional[Dict[str, Any]]:
    existing = get_reminder_by_id_for_user(reminder_id, user_id)
    if not existing:
        return None

    response = (
        supabase.table("reminders")
        .delete()
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return existing
