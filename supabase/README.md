# Supabase – TaskPilotAI

This directory is reserved for Supabase-related configuration, schema documentation, and migration notes.

## Responsibilities

Supabase handles the following for TaskPilotAI — **no duplication in FastAPI**:

| Concern | Supabase Feature |
|---|---|
| User authentication | Supabase Auth (email/password, OAuth) |
| Task data storage | PostgreSQL via Supabase |
| File / avatar storage | Supabase Storage |
| Real-time task updates | Supabase Realtime |

## Planned Database Schema (to be implemented)

### `profiles` table
Extends Supabase Auth users with display name, avatar URL, and AI preferences.

### `tasks` table
Stores all user tasks with fields: `id`, `user_id`, `title`, `description`, `priority`, `status`, `due_date`, `category`, `created_at`, `updated_at`.

### `categories` table
User-defined task categories with colour labels.

## Row-Level Security (RLS)

All tables will have RLS enabled. Users may only read/write their own rows.
Policies will be defined and documented here during the database development step.

## Migrations

SQL migration files will be added to this directory as the schema evolves.

## Setup Instructions

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key** → `frontend/js/supabase.js`
3. Copy your **Service Role Key** → `backend/.env` (server-side only, never expose to browser)
4. Enable email authentication in the Supabase dashboard → Authentication → Providers
5. Apply schema migrations (files to be added here in a later step)
