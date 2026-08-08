from datetime import date
from typing import Dict, Any, List, Optional
from services.supabase_service import supabase


def get_latest_analytics_for_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches the most recent productivity analytics record for the given user.
    """
    response = (
        supabase.table("productivity_analytics")
        .select("*")
        .eq("user_id", user_id)
        .order("analytics_date", desc=True)
        .limit(1)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def get_weekly_analytics_for_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Fetches the weekly productivity analytics records for the given user.
    """
    response = (
        supabase.table("productivity_analytics")
        .select("*")
        .eq("user_id", user_id)
        .order("analytics_date", desc=False)
        .limit(7)
        .execute()
    )
    return response.data or []


def calculate_today_analytics_for_user(user_id: str) -> Dict[str, Any]:
    """
    Calculates today's productivity metrics from public.tasks for the authenticated user
    and upserts the result into public.productivity_analytics (key: user_id + analytics_date).
    """
    today_str = date.today().isoformat()

    # Query all tasks for the user
    response = (
        supabase.table("tasks")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    all_user_tasks = response.data or []

    # Filter tasks relevant for today (due today, created today, or fallback to user tasks)
    today_tasks = [
        t for t in all_user_tasks
        if t.get("due_date") == today_str or (t.get("created_at") and str(t.get("created_at")).startswith(today_str))
    ]
    target_tasks = today_tasks if today_tasks or not all_user_tasks else all_user_tasks

    total_tasks = len(target_tasks)
    if total_tasks > 0:
        completed_tasks = len([t for t in target_tasks if str(t.get("status", "")).lower() == "completed"])
        pending_tasks = max(0, total_tasks - completed_tasks)
        completion_rate = round((completed_tasks / total_tasks) * 100.0, 2)
        productivity_score = min(100, max(0, int(round(completion_rate))))
    else:
        completed_tasks = 0
        pending_tasks = 0
        completion_rate = 0.0
        productivity_score = 0

    analytics_payload = {
        "user_id": user_id,
        "analytics_date": today_str,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "completion_rate": completion_rate,
        "productivity_score": productivity_score,
    }

    try:
        upsert_res = (
            supabase.table("productivity_analytics")
            .upsert(analytics_payload, on_conflict="user_id, analytics_date")
            .execute()
        )
        if upsert_res.data and len(upsert_res.data) > 0:
            return upsert_res.data[0]
    except Exception:
        pass

    return analytics_payload
