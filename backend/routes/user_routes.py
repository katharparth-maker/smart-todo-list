"""
TaskPilotAI – User API Routes
File: backend/routes/user_routes.py

NOTE: User authentication and profile storage are managed by Supabase Auth
and the Supabase `profiles` table. This router exists only for user-related
operations that require server-side processing — for example, syncing
user preferences that affect AI model behaviour.

Endpoints (to be defined as needed):
  GET  /users/me/preferences   – Fetch AI-relevant user preferences
  PATCH /users/me/preferences  – Update AI-relevant user preferences

Implementation deferred to the backend development step.
"""
