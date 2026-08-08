/**
 * TaskPilotAI – Tasks Module
 * File: frontend/js/tasks.js
 *
 * Responsibilities:
 *   - CRUD operations for tasks against the Supabase `tasks` table
 *     (createTask, fetchTasks, updateTask, deleteTask)
 *   - Filter and sort logic (by priority, due date, category, status)
 *   - Real-time task updates via Supabase Realtime channel subscriptions
 *   - Render task cards into the DOM on tasks.html
 *
 * NOTE: All task data is persisted in Supabase PostgreSQL.
 *       FastAPI is NOT involved in basic task CRUD.
 *
 * Dependencies:
 *   - supabase.js (Supabase client instance)
 *   - ui.js       (DOM helpers / component rendering)
 *
 * Implementation deferred to the task management development step.
 */
