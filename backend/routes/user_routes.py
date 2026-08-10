from fastapi import APIRouter, Depends
from services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/me",
    summary="Get current user profile",
    description="Returns the authenticated Supabase user's ID and email. Requires a valid Bearer token.",
    responses={
        200: {"description": "Authenticated user profile information"},
        401: {"description": "Unauthenticated - Missing or invalid Bearer token"},
    },
)
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": getattr(current_user, "id", None),
        "email": getattr(current_user, "email", None),
    }
