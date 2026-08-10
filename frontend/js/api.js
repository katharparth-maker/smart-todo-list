import { getSession } from './auth.js';

export const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Shared fetch wrapper with network error handling and HTTP status mapping.
 * Throws Error with a user-friendly message on failure.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
async function apiFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    // TypeError = network failure / server unreachable
    throw new Error('Unable to reach the server. Please check your connection.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.detail || '';
    } catch (_) { /* body not JSON */ }

    const statusMessages = {
      400: detail || 'Invalid request.',
      401: 'Your session has expired. Please log in again.',
      403: 'You do not have permission to perform this action.',
      404: detail || 'The requested resource was not found.',
      422: detail || 'The submitted data is invalid.',
      500: 'A server error occurred. Please try again later.',
    };
    throw new Error(statusMessages[response.status] || detail || `Request failed (HTTP ${response.status})`);
  }

  return response;
}

/**
 * TaskPilotAI – Backend API Client
 * File: frontend/js/api.js
 *
 * Responsibilities:
 *   - Centralises HTTP requests to the TaskPilotAI FastAPI backend
 *   - Attaches the Supabase JWT Bearer token to request headers for backend verification
 *   - Provides functions for task fetch and AI-specific endpoints
 */

/**
 * Fetch authenticated user's tasks from FastAPI backend (GET /tasks).
 * Header: Authorization: Bearer <access_token>
 * @returns {Promise<Array<Object>>} List of task objects from backend
 */

/**
 * Create a new task via FastAPI backend (POST /tasks).
 * Maps frontend form fields to exact backend schema field names.
 * Backend determines user_id from the JWT — do NOT send user_id.
 *
 * Expected payload fields (exact backend schema):
 *   title        {string}  required
 *   description  {string}  optional
 *   priority     {string}  optional — must be lowercase: "high" | "medium" | "low"
 *   status       {string}  optional — default "pending"
 *   due_date     {string}  optional — YYYY-MM-DD (snake_case, not dueDate)
 *   category     {string}  optional
 *
 * @param {Object} taskPayload - Fields matching TaskCreate schema
 * @returns {Promise<Object>} Created task object returned by backend
 */
export async function fetchTasksFromAPI() {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Authentication session required');
  }

  const response = await apiFetch(`${API_BASE_URL}/tasks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createTaskViaAPI(taskPayload) {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Authentication session required');
  }

  // Map frontend form values → exact backend TaskCreate schema field names.
  // priority must be lowercase; due_date uses snake_case.
  const body = {
    title: taskPayload.title,
    ...(taskPayload.description !== undefined && { description: taskPayload.description }),
    priority: (taskPayload.priority || 'medium').toLowerCase(),
    status: taskPayload.status || 'pending',
    ...(taskPayload.due_date && { due_date: taskPayload.due_date }),
    ...(taskPayload.category && { category: taskPayload.category })
  };

  const response = await apiFetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

/**
 * Update an existing task via FastAPI backend (PUT /tasks/{task_id}).
 * Maps frontend form fields to exact backend TaskUpdate schema field names.
 * Backend determines user ownership from the JWT — do NOT send user_id.
 *
 * TaskUpdate schema (all fields optional):
 *   title        {string}  optional
 *   description  {string}  optional
 *   priority     {string}  optional — must be lowercase: "high" | "medium" | "low"
 *   status       {string}  optional
 *   due_date     {string}  optional — YYYY-MM-DD (snake_case)
 *   category     {string}  optional
 *
 * @param {string} taskId   - The task's UUID from the backend
 * @param {Object} updates  - Fields to update (matching TaskUpdate schema)
 * @returns {Promise<Object>} Updated task object returned by backend
 */
export async function updateTaskViaAPI(taskId, updates) {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Authentication session required');
  }

  // Map to exact backend TaskUpdate schema field names.
  // priority must be lowercase; due_date uses snake_case.
  const body = {};
  if (updates.title !== undefined)       body.title       = updates.title;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.priority !== undefined)    body.priority    = String(updates.priority).toLowerCase();
  if (updates.status !== undefined)      body.status      = updates.status;
  if (updates.due_date !== undefined)    body.due_date    = updates.due_date;
  if (updates.category !== undefined)    body.category    = updates.category;

  const response = await apiFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

/**
 * Delete a task via FastAPI backend (DELETE /tasks/{task_id}).
 * No request body required. Backend determines ownership from the JWT.
 *
 * Response: { message: string, id: string }
 *
 * @param {string} taskId - The task's UUID from the backend
 * @returns {Promise<Object>} { message, id }
 */
export async function deleteTaskViaAPI(taskId) {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Authentication session required');
  }

  const response = await apiFetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  return await response.json();
}

/**
 * Fetch authenticated user's reminders from FastAPI backend (GET /reminders).
 * Header: Authorization: Bearer <access_token>
 * @returns {Promise<Array<Object>>} List of reminder objects from backend
 */
export async function fetchRemindersFromAPI() {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Authentication session required');
  }

  const response = await apiFetch(`${API_BASE_URL}/reminders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Create a new reminder via FastAPI backend (POST /reminders).
 * Header: Authorization: Bearer <access_token>
 * Body (ReminderCreate):
 *   task_id   {string} optional - links to an existing task
 *   title     {string} optional - used when creating a standalone scheduled task
 *   due_date  {string} optional - YYYY-MM-DD
 *   due_time  {string} optional - HH:mm
 *   status    {string} optional - stored on the linked task
 * @param {Object} reminderPayload
 * @returns {Promise<Object>} Created reminder object
 */
export async function createReminderViaAPI(reminderPayload) {
  const session = await getSession();
  if (!session || !session.access_token) {
    throw new Error('Authentication session required');
  }

  const body = {
    ...(reminderPayload.task_id !== undefined && { task_id: reminderPayload.task_id }),
    ...(reminderPayload.title !== undefined && { title: reminderPayload.title }),
    ...(reminderPayload.message !== undefined && { message: reminderPayload.message }),
    ...(reminderPayload.due_date !== undefined && { due_date: reminderPayload.due_date }),
    ...(reminderPayload.due_time !== undefined && { due_time: reminderPayload.due_time }),
    ...(reminderPayload.remind_at !== undefined && { remind_at: reminderPayload.remind_at }),
    ...(reminderPayload.category !== undefined && { category: reminderPayload.category }),
    ...(reminderPayload.priority !== undefined && { priority: reminderPayload.priority }),
    status: reminderPayload.status || 'pending'
  };

  const response = await apiFetch(`${API_BASE_URL}/reminders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return await response.json();
}

if (typeof window !== 'undefined') {
  window.TaskPilotAPI = {
    API_BASE_URL,
    fetchTasksFromAPI,
    createTaskViaAPI,
    updateTaskViaAPI,
    deleteTaskViaAPI,
    fetchRemindersFromAPI,
    createReminderViaAPI
  };
}


