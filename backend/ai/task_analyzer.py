import json
import re
from typing import List, Dict, Any
from ai.gemini_service import generate_ai_response


def analyze_tasks(tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes a list of tasks using Gemini AI to extract workload summary,
    recommended execution order, urgent tasks, and productivity advice.
    """
    if not tasks:
        return {
            "summary": "No tasks provided for analysis.",
            "recommended_task_order": [],
            "urgent_tasks": [],
            "advice": "Add tasks to your list to get AI-powered workload insights!"
        }

    tasks_formatted = json.dumps(tasks, indent=2)
    prompt = f"""
You are an expert AI productivity coach for TaskPilotAI.
Analyze the following list of tasks provided by a user:

{tasks_formatted}

Perform a structured evaluation considering:
1. Task urgency (due dates, status)
2. Task priority (high, medium, low)
3. Upcoming deadlines
4. Recommended execution order
5. Concise productivity advice

You MUST respond strictly with a valid JSON object matching this exact schema:
{{
  "summary": "Concise 1-2 sentence overview of the workload",
  "recommended_task_order": ["Title of task 1", "Title of task 2"],
  "urgent_tasks": ["Title of urgent task 1"],
  "advice": "Short, actionable productivity advice"
}}

Do not include markdown code block syntax (like ```json), commentary, or extra text. Output ONLY the JSON object.
"""

    response_text = generate_ai_response(prompt).strip()

    # Clean potential markdown block formatting
    cleaned_text = re.sub(r"^```(?:json)?\s*", "", response_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
    cleaned_text = cleaned_text.strip()

    try:
        data = json.loads(cleaned_text)
        return {
            "summary": str(data.get("summary", "Task analysis complete.")),
            "recommended_task_order": list(data.get("recommended_task_order", [t.get("title", "") for t in tasks if t.get("title")])),
            "urgent_tasks": list(data.get("urgent_tasks", [])),
            "advice": str(data.get("advice", "Focus on high-priority and urgent tasks first."))
        }
    except Exception:
        # Graceful fallback if output is not strictly valid JSON
        titles = [t.get("title", "Untitled") for t in tasks if t.get("title")]
        high_priority = [t.get("title", "") for t in tasks if str(t.get("priority", "")).lower() == "high"]
        return {
            "summary": response_text[:200] if response_text else "Task analysis completed successfully.",
            "recommended_task_order": titles,
            "urgent_tasks": high_priority,
            "advice": "Focus on high-priority items and upcoming due dates."
        }
