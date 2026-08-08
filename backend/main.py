from fastapi import FastAPI
from routes.user_routes import router as user_router
from routes.task_routes import router as task_router
from routes.reminder_routes import router as reminder_router
from routes.planner_routes import router as planner_router
from routes.analytics_routes import router as analytics_router
from routes.ai_routes import router as ai_router

app = FastAPI(
    title="TaskPilotAI API",
    version="1.0.0"
)

app.include_router(user_router)
app.include_router(task_router)
app.include_router(reminder_router)
app.include_router(planner_router)
app.include_router(analytics_router)
app.include_router(ai_router)


@app.get("/")
def read_root():
    return {"message": "TaskPilotAI API is running", "status": "success"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
