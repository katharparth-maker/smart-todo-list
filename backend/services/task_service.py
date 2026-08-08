"""
TaskPilotAI – Task Service (Business Logic Layer)
File: backend/services/task_service.py

Responsibilities:
  - Contains server-side task-related business logic that cannot live on the
    frontend (e.g. batch AI re-prioritisation, scheduled deadline checks)
  - Interacts with Supabase via the supabase-py admin client when server-side
    data access is required (uses the SERVICE_ROLE_KEY, never exposed to the
    browser)
  - Keeps route handlers in task_routes.py thin

NOTE: Standard task CRUD is performed client-side via the Supabase JS SDK.

Implementation deferred to the backend development step.
"""
