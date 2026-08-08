# TaskPilotAI

> An AI-powered task management web application that combines smart task organisation with Gemini-driven planning, prioritisation, and productivity insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Backend / AI | FastAPI (Python) |
| AI Engine | Google Gemini API |

---

## Project Structure

```
TaskPilotAI/
├── frontend/
│   ├── pages/           # Application pages (HTML)
│   ├── components/      # Reusable HTML component templates
│   ├── assets/          # Images, icons, branding
│   │   ├── images/
│   │   ├── icons/
│   │   └── logo/
│   ├── css/
│   │   └── style.css    # Global stylesheet
│   ├── js/
│   │   ├── main.js      # App bootstrap & routing
│   │   ├── auth.js      # Supabase Auth helpers
│   │   ├── tasks.js     # Task CRUD & Realtime
│   │   ├── planner.js   # Calendar & AI planner
│   │   ├── ui.js        # DOM utilities & component injection
│   │   ├── api.js       # FastAPI/Gemini HTTP client
│   │   └── supabase.js  # Supabase client singleton
│   └── index.html       # Root redirect shell
│
├── backend/
│   ├── ai/
│   │   ├── gemini_service.py    # Gemini SDK wrapper
│   │   ├── recommendations.py  # AI task recommendations
│   │   ├── prompt_templates.py # Centralised prompt builders
│   │   └── productivity_score.py
│   ├── routes/
│   │   ├── ai_routes.py        # AI endpoint handlers
│   │   ├── task_routes.py      # Server-side task operations
│   │   └── user_routes.py      # Server-side user operations
│   ├── services/
│   │   ├── ai_service.py       # AI business logic
│   │   ├── task_service.py     # Task business logic
│   │   └── user_service.py     # User business logic
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   └── .env                    # Environment variables (not committed)
│
└── supabase/
    └── README.md               # Schema docs & setup guide
```

---

## Architecture Overview

### Supabase (Client-side)
Handles **authentication**, **PostgreSQL data storage**, **file storage**, and **real-time subscriptions** directly from the browser using the Supabase JS SDK. RLS policies enforce data isolation per user.

### FastAPI (Server-side — AI only)
Exposes AI-powered endpoints that require server-side Gemini API calls. The frontend sends the user's Supabase JWT; FastAPI verifies it before processing.

| FastAPI Endpoint | Purpose |
|---|---|
| `POST /ai/recommendations` | AI-ranked task suggestions |
| `POST /ai/daily-plan` | Gemini-generated daily schedule |
| `GET  /ai/productivity-score` | Productivity insights |
| `POST /ai/parse-task` | Natural-language → task object |

---

## Getting Started

### Prerequisites
- Python 3.11+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) Gemini API key
- A live-server extension (e.g. VS Code Live Server) for the frontend

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Fill in backend/.env with your keys
uvicorn main:app --reload
```

### Frontend Setup
Open `frontend/index.html` with a live server (e.g. VS Code Live Server on port 5500).

---

## Development Status

| Step | Status |
|---|---|
| Project structure | ✅ Complete |
| UI & Styling | 🔜 Next |
| Supabase Auth | 🔜 Pending |
| Task CRUD | 🔜 Pending |
| Planner & Calendar | 🔜 Pending |
| Gemini AI Integration | 🔜 Pending |
| Productivity Score | 🔜 Pending |

---

## Security Notes

- **Never commit `backend/.env`** — add it to `.gitignore`.
- The Supabase **anon key** is safe to expose in the browser. All data access is governed by Row-Level Security policies.
- The Supabase **Service Role Key** is used only server-side in FastAPI and must never reach the client.
- Gemini API calls are made exclusively server-side to protect the API key.
