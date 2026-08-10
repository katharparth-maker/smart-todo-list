/**
 * TaskPilotAI – Supabase Client
 * File: frontend/js/supabase.js
 *
 * Responsibilities:
 *   - Initialise and export a single shared Supabase JS client instance
 *   - Uses the project's anon (publishable) key only — safe to expose in the browser.
 *     Row-Level Security (RLS) policies on the Supabase project enforce data access rules.
 *   - Re-exports the client so all other modules import from this one file,
 *     ensuring a single shared instance throughout the app.
 *
 * Usage:
 *   import { supabase } from './supabase.js';
 *
 * Dependencies:
 *   - @supabase/supabase-js loaded via CDN <script> tag (sets window.supabase)
 */

const SUPABASE_URL = 'https://rieqmbtmteugwdyoayhc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6irqV6bob8oLoVfbEfIbMg_eYRJOE_x';

// The Supabase CDN exposes `supabase` on window as { createClient, ... }
const { createClient } = window.supabase;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
