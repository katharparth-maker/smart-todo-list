"""
TaskPilotAI – Task API Routes
File: backend/routes/task_routes.py

NOTE: Core task CRUD (create, read, update, delete) is handled directly by
the Supabase client on the frontend. This router exists only for task-related
operations that require server-side processing — for example, batch AI
re-prioritisation of tasks triggered by a background job.

Endpoints (to be defined as needed):
  POST /tasks/reprioritize – AI-driven batch re-prioritisation

Implementation deferred to the backend development step.
"""
