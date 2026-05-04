// Server-side Supabase client with service role key - bypasses RLS.
// Use this for admin operations in server functions and server routes only.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

type SupabaseAdminClient = ReturnType<typeof createClient<Database>>;

function createSupabaseAdminClientSync(): SupabaseAdminClient {
  // Literal member access — Vite define replaces at build time; Node.js process.env at runtime.
  const SUPABASE_URL =
    process.env.MY_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY =
    process.env.MY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase server environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

let _supabaseAdmin: SupabaseAdminClient | undefined;

// Async getter (kept for API compatibility)
export function getSupabaseAdmin(): Promise<SupabaseAdminClient> {
  if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClientSync();
  return Promise.resolve(_supabaseAdmin);
}

// Lazy proxy client
export const supabaseAdmin = new Proxy({} as SupabaseAdminClient, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClientSync();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
