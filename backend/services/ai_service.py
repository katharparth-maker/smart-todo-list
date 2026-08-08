"""
TaskPilotAI – AI Service (Business Logic Layer)
File: backend/services/ai_service.py

Responsibilities:
  - Orchestrates the AI pipeline for each endpoint exposed in ai_routes.py
  - Calls the appropriate function from backend/ai/ (recommendations,
    prompt_templates, gemini_service, productivity_score)
  - Validates and sanitises input data before passing it to Gemini
  - Formats the Gemini response into a clean API response object
  - Keeps route handlers thin by centralising all AI business logic here

Implementation deferred to the AI integration development step.
"""
