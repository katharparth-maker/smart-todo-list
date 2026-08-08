from typing import List, Dict, Any
from services.supabase_service import supabase


def save_task_analysis_recommendations(
    user_id: str,
    analysis_result: Dict[str, Any],
    tasks: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Saves AI recommendations generated from task analysis into public.ai_recommendations.
    Ensures recommendations are deduplicated within the single request execution.
    """
    if not user_id:
        return []

    recommendations_to_insert = []
    seen_keys = set()

    # Create mapping of lowercased task titles to task IDs
    task_map = {}
    for task in tasks:
        title = task.get("title")
        task_id = task.get("id")
        if title:
            task_map[str(title).strip().lower()] = task_id

    # 1. Store Productivity Advice / Workload Insights
    advice = analysis_result.get("advice")
    summary = analysis_result.get("summary")
    if advice or summary:
        rec_title = "Productivity Insights"
        rec_content = f"{advice} ({summary})" if (advice and summary and advice != summary) else (advice or summary)
        key = ("priority", rec_title, rec_content)
        if key not in seen_keys:
            seen_keys.add(key)
            recommendations_to_insert.append({
                "user_id": user_id,
                "task_id": None,
                "recommendation_type": "priority",
                "title": rec_title,
                "recommendation": rec_content,
                "priority": "high" if analysis_result.get("urgent_tasks") else "medium",
            })

    # 2. Store Urgent Task Recommendations
    urgent_tasks = analysis_result.get("urgent_tasks", [])
    for task_title in urgent_tasks:
        if not task_title:
            continue
        clean_title = str(task_title).strip()
        matched_id = task_map.get(clean_title.lower())
        rec_title = f"High Urgency: {clean_title}"
        rec_content = f"Prioritize completing '{clean_title}' to meet upcoming deadlines."
        key = ("task", rec_title, clean_title.lower())
        if key not in seen_keys:
            seen_keys.add(key)
            recommendations_to_insert.append({
                "user_id": user_id,
                "task_id": matched_id,
                "recommendation_type": "task",
                "title": rec_title,
                "recommendation": rec_content,
                "priority": "high",
            })

    if not recommendations_to_insert:
        return []

    try:
        res = supabase.table("ai_recommendations").insert(recommendations_to_insert).execute()
        return res.data if res and getattr(res, "data", None) else []
    except Exception:
        # DB write failures should not disrupt the API endpoint response
        return []
