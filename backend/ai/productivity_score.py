"""
TaskPilotAI – Productivity Score Calculator
File: backend/ai/productivity_score.py

Responsibilities:
  - Accepts a user's task completion history from Supabase
  - Uses Gemini (via gemini_service.py) and/or heuristic logic to compute
    a productivity score and actionable insights
  - Returns a score (0–100) and a brief breakdown/explanation
  - Exposes a function consumed by ai_service.py and ai_routes.py

Implementation deferred to the AI integration development step.
"""
