import os
from pathlib import Path
from dotenv import load_dotenv
from google import genai

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY environment variable is missing")

# Initialize Gemini client using google-genai package
client = genai.Client(api_key=api_key)


def generate_ai_response(prompt: str) -> str:
    """
    Generates an AI text response for the given prompt using the Gemini API.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text if response and response.text else ""
    except Exception:
        # Fallback model if primary gemini-2.0-flash experiences quota limit
        response = client.models.generate_content(
            model="gemma-4-26b-a4b-it",
            contents=prompt,
        )
        return response.text if response and response.text else ""
