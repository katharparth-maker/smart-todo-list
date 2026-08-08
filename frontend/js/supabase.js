/**
 * TaskPilotAI – Supabase Client
 * File: frontend/js/supabase.js
 *
 * Responsibilities:
 *   - Initialise and export a single shared Supabase JS client instance
 *   - Load Supabase project URL and anon key from environment config
 *     (a config object or injected build-time constants — no .env in browser)
 *   - Re-export the client so all other modules import from this file,
 *     ensuring a single instance throughout the app
 *
 * Usage:
 *   import { supabase } from './supabase.js';
 *
 * NOTE: The anon key is safe to expose in the browser. Row-Level Security
 *       (RLS) policies on the Supabase project enforce data access rules.
 *
 * Dependencies:
 *   - @supabase/supabase-js (loaded via CDN <script> tag in HTML pages)
 *
 * Implementation deferred to the Supabase integration development step.
 */
