"""
TaskPilotAI – Gemini API Service
File: backend/ai/gemini_service.py

Responsibilities:
  - Initialise the google-generativeai SDK with the GEMINI_API_KEY from .env
  - Expose a low-level async function to send a prompt to a Gemini model
    and return the raw text response
  - Handle API errors, rate-limit retries, and timeout logic
  - Serve as the single integration point for the Gemini API; all other
    AI modules call this service rather than the SDK directly

Implementation deferred to the AI integration development step.
"""
