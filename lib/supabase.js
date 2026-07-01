import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Admin client — uses service role key, safe for server-only API routes.
// NOTE: Do NOT import this in client components.
let _supabaseAdmin = null;
export const getSupabaseAdmin = () => {
  if (_supabaseAdmin) return _supabaseAdmin;
  if (supabaseUrl && supabaseServiceRoleKey) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
};

// Backward-compat named export (may be null in browser bundle — prefer getSupabaseAdmin() in route handlers)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper to determine if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabase;
};
