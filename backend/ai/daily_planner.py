import json
import re
from typing import List, Dict, Any
from ai.gemini_service import generate_ai_response


def generate_daily_plan(
    date: str,
    available_start: str,
    available_end: str,
    tasks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a structured daily schedule and plan summary using Gemini AI.
    """
    if not tasks:
        return {
            "date": date,
            "schedule": [
                {
                    "start_time": available_start,
                    "end_time": available_end,
                    "task": "Planning & Free Time",
                    "reason": "No tasks provided for scheduling."
                }
            ],
            "summary": "No tasks were provided to generate a daily schedule."
        }

    tasks_formatted = json.dumps(tasks, indent=2)
    prompt = f"""
You are an expert AI daily planner for TaskPilotAI.
Create a practical, realistic daily schedule for the date: {date}.
Available time window: {available_start} to {available_end}.

Tasks to schedule:
{tasks_formatted}

Evaluation criteria:
1. Prioritize high-priority and urgent tasks with upcoming due dates.
2. Consider task status (focus on pending tasks).
3. Allocate reasonable time blocks for each task within {available_start} - {available_end}.
4. Include short breaks (5-15 mins) where appropriate.

You MUST respond strictly with a valid JSON object matching this exact schema:
{{
  "date": "{date}",
  "schedule": [
    {{
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "task": "Task title or break name",
      "reason": "Short explanation for scheduling this block"
    }}
  ],
  "summary": "Concise 1-2 sentence summary of the day's plan"
}}

Do not include markdown code block syntax (like ```json), commentary, or extra text. Output ONLY the JSON object.
"""

    response_text = generate_ai_response(prompt).strip()

    # Clean potential markdown code block formatting
    cleaned_text = re.sub(r"^```(?:json)?\s*", "", response_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r"\s*```$", "", cleaned_text)
    cleaned_text = cleaned_text.strip()

    try:
        data = json.loads(cleaned_text)
        raw_schedule = data.get("schedule", [])
        formatted_schedule = []

        for slot in raw_schedule:
            formatted_schedule.append({
                "start_time": str(slot.get("start_time", available_start)),
                "end_time": str(slot.get("end_time", available_end)),
                "task": str(slot.get("task", "Scheduled Work")),
                "reason": str(slot.get("reason", "Priority task execution."))
            })

        return {
            "date": str(data.get("date", date)),
            "schedule": formatted_schedule,
            "summary": str(data.get("summary", "Daily schedule created successfully."))
        }
    except Exception:
        # Fallback schedule if AI JSON parsing fails
        fallback_schedule = []
        if tasks:
            fallback_schedule.append({
                "start_time": available_start,
                "end_time": available_end,
                "task": tasks[0].get("title", "Primary Task"),
                "reason": "Focus on high priority task execution."
            })
        else:
            fallback_schedule.append({
                "start_time": available_start,
                "end_time": available_end,
                "task": "Planning Session",
                "reason": "Default slot."
            })
        return {
            "date": date,
            "schedule": fallback_schedule,
            "summary": "Daily plan generated successfully."
        }
