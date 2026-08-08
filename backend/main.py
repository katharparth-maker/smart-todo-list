"""
TaskPilotAI – FastAPI Application Entry Point
File: backend/main.py

Responsibilities:
  - Create and configure the FastAPI application instance
  - Register all API routers (ai_routes, task_routes, user_routes)
  - Configure CORS middleware (restrict to frontend origin in production)
  - Set up lifespan events (startup / shutdown) for resource management
  - Mount the /health endpoint for liveness checks

Architecture Note:
  Authentication and core data storage are handled by Supabase, NOT by
  this FastAPI service. This backend exists primarily to expose AI-powered
  endpoints that require server-side Gemini API calls.

Implementation deferred to the backend development step.
"""
