"""
TaskPilotAI – Gemini Prompt Templates
File: backend/ai/prompt_templates.py

Responsibilities:
  - Define and export prompt-builder functions for each AI feature:
      build_recommendations_prompt(tasks, user_context) -> str
      build_daily_plan_prompt(tasks, date, preferences) -> str
      build_parse_task_prompt(natural_language_text)   -> str
      build_productivity_prompt(task_history)           -> str
  - Keep prompt logic centralised so that changes to model instructions
    require edits in only one place
  - Apply structured output formatting instructions (e.g. JSON output mode)
    within prompts where appropriate

Implementation deferred to the AI integration development step.
"""
