import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import type { Database } from "@/integrations/supabase/types";

let adminClient: SupabaseClient<Database> | null = null;

export async function getAdminSupabase() {
  if (adminClient) return adminClient;

  // Literal member access so Vite's define can statically replace at build time,
  // and Node.js process.env provides the value at runtime if not baked in.
  const url =
    import.meta.env.VITE_MY_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    process.env.MY_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key =
    process.env.MY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Configuração do servidor incompleta: SUPABASE_URL=${url ? "ok" : "MISSING"} KEY=${key ? "ok" : "MISSING"}`,
    );
  }

  adminClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export async function verifyAdminPassword(password: string, storedHash: string) {
  if (!storedHash) return false;

  if (storedHash === password) return true;

  try {
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

export async function hashAdminPassword(password: string) {
  return bcrypt.hash(password, 10);
}
