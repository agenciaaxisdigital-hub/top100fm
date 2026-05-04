type RuntimeEnvKey =
  | "SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SUPABASE_PUBLISHABLE_KEY"
  | "MY_SUPABASE_URL"
  | "MY_SUPABASE_SERVICE_ROLE_KEY"
  | "MY_SUPABASE_PUBLISHABLE_KEY"
  | "MY_ADMIN_SESSION_SECRET"
  | "ADMIN_SESSION_SECRET";

function readFromRecord(source: unknown, key: RuntimeEnvKey): string | undefined {
  const value = (source as Record<string, unknown> | undefined)?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function readRuntimeEnvValue(key: RuntimeEnvKey): Promise<string | undefined> {
  if (typeof process !== "undefined" && process.env) {
    const fromProcess = readFromRecord(process.env, key);
    if (fromProcess) return fromProcess;
  }

  const g = globalThis as Record<string, unknown> & {
    env?: Record<string, unknown>;
    process?: { env?: Record<string, unknown> };
    __env__?: Record<string, unknown>;
  };

  const fromGlobal =
    readFromRecord(g, key) || readFromRecord(g.env, key) || readFromRecord(g.__env__, key) || readFromRecord(g.process?.env, key);
  if (fromGlobal) return fromGlobal;

  // Note: do NOT do dynamic access on import.meta.env — Vite's module runner
  // forbids it. Static accesses below are inlined at build time.
  // Only non-sensitive vars are read from VITE_ (client-exposed) env.
  // Service role keys and session secrets must come from process.env or globalThis.env only.
  const viteEnv: Record<string, string | undefined> = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    MY_SUPABASE_URL: import.meta.env.VITE_MY_SUPABASE_URL,
    MY_SUPABASE_SERVICE_ROLE_KEY: undefined,
    MY_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_MY_SUPABASE_PUBLISHABLE_KEY,
    ADMIN_SESSION_SECRET: undefined,
    MY_ADMIN_SESSION_SECRET: undefined,
  };
  const fromMeta = viteEnv[key];
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;

  return undefined;
}

export async function getRuntimeEnv(key: RuntimeEnvKey): Promise<string | undefined> {
  return readRuntimeEnvValue(key);
}

export async function resolveRuntimeEnv(...keys: RuntimeEnvKey[]): Promise<string | undefined> {
  for (const key of keys) {
    const value = await readRuntimeEnvValue(key);
    if (value) return value;
  }
  return undefined;
}
