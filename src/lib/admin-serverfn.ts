import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeader, useSession } from "@tanstack/react-start/server";
import { verifyAdminToken } from "@/lib/admin-token";

const ADMIN_COOKIE = "admin_session";
const ADMIN_HEADER = "x-admin-token";
const SESSION_DURATION = 60 * 60 * 24;

export async function getAdminSecret() {
  // Literal member access — Vite's define replaces at build time; Node.js process.env at runtime.
  const raw =
    process.env.MY_ADMIN_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.MY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) return undefined;
  return raw.length >= 32 ? raw : (raw + "x".repeat(32)).slice(0, 32);
}


export async function getAdminSessionConfig() {
  const isSecure = process.env.NODE_ENV === "production";
  const password = await getAdminSecret();

  if (!password) {
    throw new Error("Configuração da sessão admin incompleta");
  }

  return {
    name: ADMIN_COOKIE,
    password,
    maxAge: SESSION_DURATION,
    cookie: {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export const adminClientTokenMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("admin_session") || localStorage.getItem("admin_session")
      : null;

  return next({
    headers: token
      ? {
          [ADMIN_HEADER]: token,
        }
      : undefined,
  });
});

const requireAdminMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  let sessionAuthenticated = false;

  try {
    const session = await useSession<{ authenticated?: boolean }>(await getAdminSessionConfig());
    sessionAuthenticated = session.data.authenticated === true;
  } catch {
    sessionAuthenticated = false;
  }

  const secret = await getAdminSecret();
  const headerToken = getRequestHeader(ADMIN_HEADER);
  const hasValidHeader = secret ? await verifyAdminToken(headerToken, secret) : false;

  if (!sessionAuthenticated && !hasValidHeader) {
    throw new Error("Não autorizado");
  }

  return next();
});

export function createAdminServerFn(method: "GET" | "POST") {
  return createServerFn({ method }).middleware([adminClientTokenMiddleware, requireAdminMiddleware]);
}
