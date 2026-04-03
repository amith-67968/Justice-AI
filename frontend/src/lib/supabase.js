import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseBrowserKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

let browserClient = null;

export function isSupabaseAuthConfigured() {
  return Boolean(supabaseUrl && supabaseBrowserKey);
}

export function getSupabaseAuthConfigError() {
  if (!supabaseUrl && !supabaseBrowserKey) {
    return 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.';
  }

  if (!supabaseUrl) {
    return 'Missing VITE_SUPABASE_URL in frontend/.env.';
  }

  if (!supabaseBrowserKey) {
    return 'Missing VITE_SUPABASE_ANON_KEY in frontend/.env.';
  }

  return '';
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error(getSupabaseAuthConfigError());
  }

  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseBrowserKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
