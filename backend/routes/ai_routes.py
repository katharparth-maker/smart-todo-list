from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, model_validator
from services.auth_service import get_current_user
from services.ai_recommendation_service import save_task_analysis_recommendations
from ai.gemini_service import generate_ai_response
from ai.task_analyzer import analyze_tasks
from ai.daily_planner import generate_daily_plan


class AITestRequest(BaseModel):
    prompt: str

    model_config = ConfigDict(extra="ignore")


class AITestResponse(BaseModel):
    response: str


class TaskItemInput(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    due_date: Optional[str] = None

    model_config = ConfigDict(extra="ignore")


class TaskAnalysisRequest(BaseModel):
    tasks: List[TaskItemInput]

    model_config = ConfigDict(extra="ignore")


class TaskAnalysisResponse(BaseModel):
    summary: str
    recommended_task_order: List[str]
    urgent_tasks: List[str]
    advice: str


class DailyPlanRequest(BaseModel):
    date: str
    available_start: str
    available_end: str
    tasks: List[TaskItemInput]

    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="after")
    def validate_time_window(self):
        try:
            start_h, start_m = map(int, self.available_start.split(":"))
            end_h, end_m = map(int, self.available_end.split(":"))
            start_mins = start_h * 60 + start_m
            end_mins = end_h * 60 + end_m
            if end_mins <= start_mins:
                raise ValueError("available_end must be later than available_start")
        except ValueError as e:
            raise e
        except Exception:
            raise ValueError("available_start and available_end must be in HH:MM format")
        return self


class ScheduleSlot(BaseModel):
    start_time: str
    end_time: str
    task: str
    reason: str


class DailyPlanResponse(BaseModel):
    date: str
    schedule: List[ScheduleSlot]
    summary: str


router = APIRouter(prefix="/ai", tags=["ai"])


@router.post(
    "/test",
    response_model=AITestResponse,
    summary="Test AI prompt",
    description="Send a raw prompt to the AI service and receive a response.",
    responses={
        200: {"description": "AI generated response"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        500: {"description": "AI service error"},
    },
)
@router.post("/test/", response_model=AITestResponse, include_in_schema=False)
def ai_test(request_data: AITestRequest, current_user=Depends(get_current_user)):
    try:
        ai_response = generate_ai_response(request_data.prompt)
        return {"response": ai_response}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}",
        )


@router.post(
    "/analyze-tasks",
    response_model=TaskAnalysisResponse,
    summary="Analyze tasks with AI",
    description="Analyze a list of tasks for priority ordering, urgency, and productivity advice.",
    responses={
        200: {"description": "Task analysis result"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        422: {"description": "Validation error in task list"},
        500: {"description": "Task analysis error"},
    },
)
@router.post("/analyze-tasks/", response_model=TaskAnalysisResponse, include_in_schema=False)
def analyze_user_tasks(
    request_data: TaskAnalysisRequest,
    current_user=Depends(get_current_user)
):
    try:
        raw_tasks = [task.model_dump() for task in request_data.tasks]
        result = analyze_tasks(raw_tasks)

        # Store recommendations in Supabase for authenticated user
        user_id = getattr(current_user, "id", None)
        if user_id:
            save_task_analysis_recommendations(
                user_id=user_id,
                analysis_result=result,
                tasks=raw_tasks,
            )

        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Task analysis failed: {str(e)}",
        )


@router.post(
    "/daily-plan",
    response_model=DailyPlanResponse,
    summary="Generate daily AI plan",
    description="Generate an optimized hourly timeline schedule for a date given available time window and tasks.",
    responses={
        200: {"description": "Generated daily schedule plan"},
        400: {"description": "Invalid time window"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
        422: {"description": "Validation error"},
        500: {"description": "Daily planner service error"},
    },
)
@router.post("/daily-plan/", response_model=DailyPlanResponse, include_in_schema=False)
def create_daily_plan(
    request_data: DailyPlanRequest,
    current_user=Depends(get_current_user)
):
    try:
        raw_tasks = [task.model_dump() for task in request_data.tasks]
        result = generate_daily_plan(
            date=request_data.date,
            available_start=request_data.available_start,
            available_end=request_data.available_end,
            tasks=raw_tasks
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Daily planner error: {str(e)}",
        )
