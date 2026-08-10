import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from routes.user_routes import router as user_router
from routes.task_routes import router as task_router
from routes.reminder_routes import router as reminder_router
from routes.planner_routes import router as planner_router
from routes.analytics_routes import router as analytics_router
from routes.ai_routes import router as ai_router

openapi_tags = [
    {
        "name": "users",
        "description": "User authentication and profile management endpoints.",
    },
    {
        "name": "tasks",
        "description": "Task creation, retrieval, updates, and deletion.",
    },
    {
        "name": "reminders",
        "description": "Reminder management and notification scheduling.",
    },
    {
        "name": "planner",
        "description": "Daily calendar timeline planning and event scheduling.",
    },
    {
        "name": "analytics",
        "description": "Productivity scores, completion metrics, and stats.",
    },
    {
        "name": "ai",
        "description": "AI-powered task analysis, daily schedule generation, and recommendations.",
    },
]

app = FastAPI(
    title="TaskPilot AI API",
    description="AI-powered task management and productivity API",
    version="1.0.0",
    openapi_tags=openapi_tags,
)

# CORS – allow the frontend local dev server (all ports on localhost/127.0.0.1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173"
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"],
)

app.include_router(user_router)
app.include_router(task_router)
app.include_router(reminder_router)
app.include_router(planner_router)
app.include_router(analytics_router)
app.include_router(ai_router)


logger = logging.getLogger("taskpilotai")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return a clean 422 with field-level detail instead of FastAPI's verbose default."""
    errors = exc.errors()
    messages = []
    for err in errors:
        loc = " → ".join(str(l) for l in err.get("loc", []) if l != "body")
        msg = err.get("msg", "Invalid value")
        messages.append(f"{loc}: {msg}" if loc else msg)
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(messages) or "Validation error"}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all handler: log safely, return generic 500 — never expose stack traces."""
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )


@app.get("/")
def read_root():
    return {"message": "TaskPilotAI API is running", "status": "success"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
