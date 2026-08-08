"""
TaskPilotAI – User Service (Business Logic Layer)
File: backend/services/user_service.py

Responsibilities:
  - Contains server-side user-related business logic that requires the
    Supabase admin client (SERVICE_ROLE_KEY)
  - Handles operations such as syncing AI preference settings and
    fetching user metadata needed by the AI pipeline
  - Keeps route handlers in user_routes.py thin

NOTE: User authentication (sign-up, login, logout, password reset) is
      handled entirely by Supabase Auth on the frontend via auth.js.
      Do NOT re-implement auth logic here.

Implementation deferred to the backend development step.
"""
