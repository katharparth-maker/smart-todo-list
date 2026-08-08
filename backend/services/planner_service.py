from typing import Dict, Any, List, Optional
from services.supabase_service import supabase


def get_planner_entries_for_user(user_id: str) -> List[Dict[str, Any]]:
    response = supabase.table("planner").select("*").eq("user_id", user_id).execute()
    return response.data or []


def create_planner_entry_for_user(
    user_id: str, planner_data: Dict[str, Any]
) -> Dict[str, Any]:
    payload = {**planner_data, "user_id": user_id}
    response = supabase.table("planner").insert(payload).execute()
    return response.data[0] if response.data else {}


def get_planner_entry_by_id_for_user(
    planner_id: str, user_id: str
) -> Optional[Dict[str, Any]]:
    response = (
        supabase.table("planner")
        .select("*")
        .eq("id", planner_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def update_planner_entry_for_user(
    planner_id: str, user_id: str, update_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    existing = get_planner_entry_by_id_for_user(planner_id, user_id)
    if not existing:
        return None

    filtered_payload = {k: v for k, v in update_data.items() if v is not None}
    if not filtered_payload:
        return existing

    response = (
        supabase.table("planner")
        .update(filtered_payload)
        .eq("id", planner_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def delete_planner_entry_for_user(
    planner_id: str, user_id: str
) -> Optional[Dict[str, Any]]:
    existing = get_planner_entry_by_id_for_user(planner_id, user_id)
    if not existing:
        return None

    response = (
        supabase.table("planner")
        .delete()
        .eq("id", planner_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return existing
