import { createServerFn } from "@tanstack/react-start";
import { setCookie, deleteCookie, getRequestHeader, useSession } from "@tanstack/react-start/server";
import { adminClientTokenMiddleware, getAdminSecret, getAdminSessionConfig } from "@/lib/admin-serverfn";
import { getAdminSupabase, verifyAdminPassword } from "@/lib/admin-supabase";
import { createAdminToken, verifyAdminToken } from "@/lib/admin-token";

const ADMIN_COOKIE = "admin_session";
const ADMIN_PRESENCE_COOKIE = "admin_present";
const SESSION_DURATION = 60 * 60 * 24;
const SESSION_TOKEN_VALUE = "authenticated";
const IS_SECURE_COOKIE = process.env.NODE_ENV === "production";
export const ADMIN_SESSION_KEY = ADMIN_COOKIE;
export const ADMIN_PRESENCE_KEY = ADMIN_PRESENCE_COOKIE;
export const ADMIN_SESSION_TOKEN = SESSION_TOKEN_VALUE;

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { username: string; password: string }) => input)
  .handler(async ({ data }) => {
    try {
    const username = data.username.trim();
    const password = data.password;

    if (!username || !password) {
      return { success: false, error: "Preencha usuário e senha." };
    }

    const supabase = await getAdminSupabase();
    const { data: user, error } = await supabase
      .from("admin_users")
      .select("id, username, password_hash")
      .ilike("username", username)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const isValid = user ? await verifyAdminPassword(password, user.password_hash) : false;
    if (!user || !isValid) {
      return { success: false, error: "Credenciais inválidas" };
    }

    let session;
    try {
      session = await useSession<{ authenticated: boolean; username?: string }>(await getAdminSessionConfig());
    } catch {
      try { deleteCookie(ADMIN_COOKIE); } catch {}
      session = await useSession<{ authenticated: boolean; username?: string }>(await getAdminSessionConfig());
    }
    await session.update({ authenticated: true, username: user.username });
    const secret = (await getAdminSessionConfig()).password;
    const token = await createAdminToken(
      {
        username: user.username,
        expiresAt: Date.now() + SESSION_DURATION * 1000,
      },
      secret,
    );

    setCookie(ADMIN_PRESENCE_COOKIE, "1", {
      httpOnly: false,
      secure: IS_SECURE_COOKIE,
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return { success: true, token };
    } catch (e: any) {
      console.error("[adminLogin] FAILED:", e?.message, e?.stack);
      return { success: false, error: `Erro: ${e?.message || "desconhecido"}` };
    }
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<{ authenticated?: boolean }>(await getAdminSessionConfig());
  await session.clear();
  deleteCookie(ADMIN_COOKIE);
  deleteCookie(ADMIN_PRESENCE_COOKIE);
  return { success: true };
});

export const checkAdminSession = createServerFn({ method: "GET" })
  .middleware([adminClientTokenMiddleware])
  .handler(async () => {
    let sessionAuthenticated = false;
    try {
      const session = await useSession<{ authenticated?: boolean }>(await getAdminSessionConfig());
      sessionAuthenticated = session.data.authenticated === true;
    } catch {
      try {
        deleteCookie(ADMIN_COOKIE);
      } catch {}
    }

    const secret = await getAdminSecret();
    const headerToken = getRequestHeader("x-admin-token");
    const hasValidHeader = secret ? await verifyAdminToken(headerToken, secret) : false;
    const authenticated = sessionAuthenticated || hasValidHeader;

    if (!authenticated) {
      try {
        deleteCookie(ADMIN_PRESENCE_COOKIE);
      } catch {}
    }

    return { authenticated };
  });
