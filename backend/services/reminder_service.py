from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from services.supabase_service import supabase


import logging

logger = logging.getLogger(__name__)

REMINDER_SELECT = "*,tasks(id,title,description,priority,status,due_date,due_time,category,created_at,updated_at)"
REMINDER_TABLE_COLUMNS = {"task_id", "reminder_time"}
TASK_FIELDS_FROM_REMINDER = {
    "title",
    "description",
    "priority",
    "status",
    "due_date",
    "due_time",
    "category",
}


def _parse_reminder_datetime(reminder_data: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    due_date = reminder_data.get("due_date")
    due_time = reminder_data.get("due_time")

    if due_date or due_time:
        return due_date, due_time

    remind_at = reminder_data.get("remind_at")
    if not remind_at:
        return None, None

    try:
        parsed = datetime.fromisoformat(str(remind_at).replace("Z", "+00:00"))
        return parsed.date().isoformat(), parsed.strftime("%H:%M")
    except ValueError:
        if "T" in str(remind_at):
            date_part, time_part = str(remind_at).split("T", 1)
            return date_part, time_part[:5]
        return str(remind_at), None


def _build_remind_at(task: Optional[Dict[str, Any]], fallback_created_at: Optional[str]) -> Optional[str]:
    if not task:
        return fallback_created_at

    due_date = task.get("due_date")
    due_time = task.get("due_time")
    if due_date and due_time:
        return f"{due_date}T{due_time}:00"
    if due_date:
        return str(due_date)
    return fallback_created_at


def _build_reminder_time(
    reminder_data: Dict[str, Any],
    task: Optional[Dict[str, Any]] = None,
) -> str:
    due_date, due_time = _parse_reminder_datetime(reminder_data)

    if not due_date and task:
        due_date = task.get("due_date")
    if not due_time and task:
        due_time = task.get("due_time")

    if due_date and due_time:
        return f"{due_date}T{due_time}:00"
    if due_date:
        return f"{due_date}T09:00:00"
    return datetime.now(timezone.utc).isoformat()


def _normalize_reminder(row: Dict[str, Any]) -> Dict[str, Any]:
    task = row.get("tasks") or row.get("task")
    normalized = {k: v for k, v in row.items() if k != "tasks"}
    reminder_time = row.get("reminder_time")
    if task:
        normalized["task"] = task
        normalized["message"] = task.get("title") or "Task Reminder"
        normalized["title"] = task.get("title")
        normalized["status"] = task.get("status") or "pending"
        normalized["remind_at"] = reminder_time or _build_remind_at(task, row.get("created_at"))
    else:
        normalized["message"] = "Task Reminder"
        normalized["status"] = "pending"
        normalized["remind_at"] = reminder_time or row.get("created_at")
    return normalized


def _normalize_priority(priority: Optional[str]) -> str:
    value = str(priority or "medium").strip().lower()
    if value == "normal":
        return "medium"
    if value not in {"high", "medium", "low"}:
        return "medium"
    return value


def _create_task_for_standalone_reminder(
    user_id: str, reminder_data: Dict[str, Any]
) -> Dict[str, Any]:
    title = reminder_data.get("title") or reminder_data.get("message")
    if not title:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="title or task_id is required to create a reminder",
        )

    due_date, due_time = _parse_reminder_datetime(reminder_data)
    task_payload = {
        "user_id": user_id,
        "title": str(title).strip(),
        "priority": _normalize_priority(reminder_data.get("priority")),
        "status": reminder_data.get("status") or "pending",
        "category": reminder_data.get("category") or "General",
    }

    if due_date:
        task_payload["due_date"] = due_date
    if due_time:
        task_payload["due_time"] = due_time

    response = supabase.table("tasks").insert(task_payload).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return task_payload


def _get_reminder_with_task(reminder_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    response = (
        supabase.table("reminders")
        .select(REMINDER_SELECT)
        .eq("id", reminder_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return _normalize_reminder(response.data[0])
    return None


def _get_task_for_user(task_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    response = (
        supabase.table("tasks")
        .select("id,title,description,priority,status,due_date,due_time,category,created_at,updated_at")
        .eq("id", task_id)
        .eq("user_id", user_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def validate_task_ownership(task_id: str, user_id: str) -> bool:
    try:
        res = (
            supabase.table("tasks")
            .select("id")
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(res.data and len(res.data) > 0)
    except Exception as e:
        logger.error(f"Error validating task ownership: {e}")
        return False


def get_reminders_for_user(user_id: str) -> List[Dict[str, Any]]:
    try:
        response = (
            supabase.table("reminders")
            .select(REMINDER_SELECT)
            .eq("user_id", user_id)
            .execute()
        )
        return [_normalize_reminder(row) for row in (response.data or [])]
    except Exception as e:
        logger.error(f"Error fetching reminders for user {user_id}: {e}")
        return []


def create_reminder_for_user(
    user_id: str, reminder_data: Dict[str, Any]
) -> Dict[str, Any]:
    try:
        task_id = reminder_data.get("task_id")
        task = None
        if not task_id:
            task = _create_task_for_standalone_reminder(user_id, reminder_data)
            task_id = task.get("id")
        else:
            task = _get_task_for_user(task_id, user_id)

        payload = {
            "user_id": user_id,
            "task_id": task_id,
            "reminder_time": _build_reminder_time(reminder_data, task),
        }
        logger.info(f"Creating reminder for user {user_id}: keys={list(payload.keys())}")
        response = supabase.table("reminders").insert(payload).execute()
        if response.data and len(response.data) > 0:
            reminder_id = response.data[0].get("id")
            if reminder_id:
                created = _get_reminder_with_task(reminder_id, user_id)
                if created:
                    return created
            return _normalize_reminder(response.data[0])
        return _normalize_reminder(payload)
    except Exception as e:
        from fastapi import HTTPException

        if isinstance(e, HTTPException):
            raise
        logger.error(f"Error inserting reminder into Supabase: {e}", exc_info=True)
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create reminder: {str(e)}",
        )


def get_reminder_by_id_for_user(
    reminder_id: str, user_id: str
) -> Optional[Dict[str, Any]]:
    return _get_reminder_with_task(reminder_id, user_id)


def update_reminder_for_user(
    reminder_id: str, user_id: str, update_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    existing = get_reminder_by_id_for_user(reminder_id, user_id)
    if not existing:
        return None

    reminder_payload = {
        k: v
        for k, v in update_data.items()
        if k in REMINDER_TABLE_COLUMNS and v is not None
    }

    task_payload = {
        k: v
        for k, v in update_data.items()
        if k in TASK_FIELDS_FROM_REMINDER and v is not None
    }
    if "message" in update_data and update_data["message"] is not None:
        task_payload["title"] = update_data["message"]
    if "remind_at" in update_data and update_data["remind_at"] is not None:
        due_date, due_time = _parse_reminder_datetime(update_data)
        if due_date:
            task_payload["due_date"] = due_date
        if due_time:
            task_payload["due_time"] = due_time
        reminder_payload["reminder_time"] = _build_reminder_time(update_data)
    elif "due_date" in task_payload or "due_time" in task_payload:
        merged_data = {
            "due_date": task_payload.get("due_date"),
            "due_time": task_payload.get("due_time"),
        }
        reminder_payload["reminder_time"] = _build_reminder_time(
            merged_data,
            existing.get("task"),
        )
    if "priority" in task_payload:
        task_payload["priority"] = _normalize_priority(task_payload["priority"])

    if not reminder_payload and not task_payload:
        return existing

    if reminder_payload:
        supabase.table("reminders").update(reminder_payload).eq("id", reminder_id).eq(
            "user_id", user_id
        ).execute()

    if task_payload and existing.get("task_id"):
        supabase.table("tasks").update(task_payload).eq("id", existing["task_id"]).eq(
            "user_id", user_id
        ).execute()

    return _get_reminder_with_task(reminder_id, user_id)


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
