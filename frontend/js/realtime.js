/**
 * TaskPilotAI – Supabase Realtime Module
 * File: frontend/js/realtime.js
 *
 * Subscribes to Supabase Realtime changes on the "tasks" and "reminders"
 * tables for the currently authenticated user.
 *
 * On any INSERT / UPDATE / DELETE event the existing data-loading functions
 * are called so the UI refreshes without a page reload.
 *
 * Cleanup: call destroyRealtimeChannels() on pagehide / beforeunload to avoid
 * memory leaks and duplicate subscriptions.
 */

import { supabase } from './supabase.js';
import { getSession } from './auth.js';

/** Active channel references so we can unsubscribe cleanly. */
let _taskChannel = null;
let _reminderChannel = null;

/**
 * Debounce helper – prevents hammering the API when Supabase fires several
 * events in quick succession (e.g. a bulk update).
 */
function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Initialise Supabase Realtime subscriptions for the authenticated user.
 * Safe to call multiple times – destroys any existing subscriptions first.
 *
 * @param {Object} options
 * @param {Function} options.onTaskChange      - loadAndRenderApiTasks
 * @param {Function} options.onReminderChange  - loadAndRenderApiReminders
 */
export async function initRealtimeSubscriptions({ onTaskChange, onReminderChange }) {
  await destroyRealtimeChannels();

  let session;
  try {
    session = await getSession();
  } catch (err) {
    console.warn('[TaskPilot Realtime] Could not retrieve session – skipping realtime setup.', err);
    return;
  }

  if (!session || !session.user) {
    console.warn('[TaskPilot Realtime] No authenticated user – skipping realtime setup.');
    return;
  }

  const userId = session.user.id;

  const debouncedTaskRefresh = debounce(async () => {
    try {
      if (typeof onTaskChange === 'function') await onTaskChange();
    } catch (err) {
      console.error('[TaskPilot Realtime] Error refreshing tasks:', err);
    }
  }, 350);

  const debouncedReminderRefresh = debounce(async () => {
    try {
      if (typeof onReminderChange === 'function') await onReminderChange();
    } catch (err) {
      console.error('[TaskPilot Realtime] Error refreshing reminders:', err);
    }
  }, 350);

  // ── tasks channel ──────────────────────────────────────────────────────
  try {
    _taskChannel = supabase
      .channel('taskpilot-tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: 'user_id=eq.' + userId },
        (payload) => {
          console.info('[TaskPilot Realtime] tasks ' + payload.eventType, payload.new || payload.old);
          debouncedTaskRefresh();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.info('[TaskPilot Realtime] Subscribed to tasks channel.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[TaskPilot Realtime] tasks channel error:', status, err);
        }
      });
  } catch (err) {
    console.error('[TaskPilot Realtime] Failed to create tasks channel:', err);
  }

  // ── reminders channel ──────────────────────────────────────────────────
  try {
    _reminderChannel = supabase
      .channel('taskpilot-reminders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders', filter: 'user_id=eq.' + userId },
        (payload) => {
          console.info('[TaskPilot Realtime] reminders ' + payload.eventType, payload.new || payload.old);
          debouncedReminderRefresh();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.info('[TaskPilot Realtime] Subscribed to reminders channel.');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[TaskPilot Realtime] reminders channel error:', status, err);
        }
      });
  } catch (err) {
    console.error('[TaskPilot Realtime] Failed to create reminders channel:', err);
  }
}

/**
 * Unsubscribe from and remove all active Realtime channels.
 * Call on pagehide / beforeunload to prevent memory leaks.
 */
export async function destroyRealtimeChannels() {
  if (_taskChannel) {
    try { await supabase.removeChannel(_taskChannel); } catch (_) {}
    _taskChannel = null;
    console.info('[TaskPilot Realtime] tasks channel removed.');
  }
  if (_reminderChannel) {
    try { await supabase.removeChannel(_reminderChannel); } catch (_) {}
    _reminderChannel = null;
    console.info('[TaskPilot Realtime] reminders channel removed.');
  }
}

if (typeof window !== 'undefined') {
  window.TaskPilotRealtime = { initRealtimeSubscriptions, destroyRealtimeChannels };
}