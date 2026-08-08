/**
 * TaskPilotAI – Backend API Client
 * File: frontend/js/api.js
 *
 * Responsibilities:
 *   - Centralises all HTTP requests to the TaskPilotAI FastAPI backend
 *   - Provides functions for AI-specific endpoints:
 *       getAIRecommendations(userId, tasks)  → POST /ai/recommendations
 *       getDailyPlan(userId, date)           → POST /ai/daily-plan
 *       getProductivityScore(userId)         → GET  /ai/productivity-score
 *       parseNaturalLanguageTask(text)       → POST /ai/parse-task
 *   - Attaches the Supabase JWT to request headers for backend identity
 *     verification (FastAPI validates the token against Supabase)
 *   - Handles HTTP errors and surfaces them via ui.js notifications
 *
 * NOTE: All Supabase data operations (tasks CRUD, auth) are handled by
 *       supabase.js and tasks.js — NOT by this module.
 *
 * Dependencies:
 *   - supabase.js (to retrieve the active session JWT)
 *   - ui.js       (to surface error notifications)
 *
 * Implementation deferred to the AI integration development step.
 */
