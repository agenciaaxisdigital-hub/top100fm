import { createAdminServerFn, getAdminSecret, adminClientTokenMiddleware } from "@/lib/admin-serverfn";
import { getAdminSupabase, hashAdminPassword } from "@/lib/admin-supabase";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { verifyAdminToken } from "@/lib/admin-token";

export const getPromotions = createAdminServerFn("GET").handler(async () => {
  const supabase = await getAdminSupabase();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
});

export const createPromotion = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      title: string;
      description?: string;
      image_url?: string;
      link?: string;
      popup_duration_seconds?: number;
      show_as_popup?: boolean;
      display_order?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { data: result, error } = await supabase
      .from("promotions")
      .insert({ ...data, is_active: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const updatePromotion = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      id: string;
      title?: string;
      description?: string;
      image_url?: string;
      link?: string;
      is_active?: boolean;
      popup_duration_seconds?: number;
      show_as_popup?: boolean;
      display_order?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { id, ...updates } = data;
    const { data: result, error } = await supabase
      .from("promotions")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deletePromotion = createAdminServerFn("POST")
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { error } = await supabase.from("promotions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getNews = createAdminServerFn("GET").handler(async () => {
  const supabase = await getAdminSupabase();
  const { data, error } = await (supabase as any)
    .from("news")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
});

export const createNews = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      title: string;
      content?: string;
      summary?: string;
      image_url?: string;
      podcast_link?: string;
      display_order?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { data: result, error } = await supabase.from("news").insert(data).select().single();
    if (error) throw new Error(error.message);
    return result;
  });

export const updateNews = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      id: string;
      title?: string;
      content?: string;
      summary?: string;
      image_url?: string;
      podcast_link?: string;
      is_published?: boolean;
      is_pinned?: boolean;
      pinned_at?: string | null;
      display_order?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { id, ...updates } = data;
    const { data: result, error } = await (supabase as any)
      .from("news")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteNews = createAdminServerFn("POST")
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { error } = await supabase.from("news").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getProgramacaoAdmin = createAdminServerFn("GET").handler(async () => {
  const supabase = await getAdminSupabase();
  const { data } = await (supabase as any)
    .from("programacao")
    .select("*")
    .order("day_of_week")
    .order("start_time");
  return data || [];
});

export const createProgramacao = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      day_of_week: number;
      program_name: string;
      presenter?: string;
      start_time: string;
      end_time: string;
      display_order?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { data: result, error } = await (supabase as any)
      .from("programacao")
      .insert({ ...data, is_active: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const updateProgramacao = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      id: string;
      day_of_week?: number;
      program_name?: string;
      presenter?: string;
      start_time?: string;
      end_time?: string;
      display_order?: number;
      is_active?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { id, ...updates } = data;
    const { data: result, error } = await (supabase as any)
      .from("programacao")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deleteProgramacao = createAdminServerFn("POST")
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { error } = await (supabase as any).from("programacao").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPodcastsAdmin = createAdminServerFn("GET").handler(async () => {
  const supabase = await getAdminSupabase();
  const { data } = await (supabase as any)
    .from("podcasts")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });
  return data || [];
});

export const createPodcast = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      title: string;
      description?: string;
      youtube_url: string;
      thumbnail_url?: string;
      display_order?: number;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { data: result, error } = await (supabase as any)
      .from("podcasts")
      .insert({ ...data, is_active: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const updatePodcast = createAdminServerFn("POST")
  .inputValidator(
    (input: {
      id: string;
      title?: string;
      description?: string;
      youtube_url?: string;
      thumbnail_url?: string;
      display_order?: number;
      is_active?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { id, ...updates } = data;
    const { data: result, error } = await (supabase as any)
      .from("podcasts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  });

export const deletePodcast = createAdminServerFn("POST")
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { error } = await (supabase as any).from("podcasts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const createAdminUser = createAdminServerFn("POST")
  .inputValidator((input: { username: string; password: string }) => input)
  .handler(async ({ data }) => {
    const supabase = await getAdminSupabase();
    const username = data.username.trim();

    if (!username || data.password.length < 8) {
      throw new Error("Usuário obrigatório e senha com no mínimo 8 caracteres.");
    }

    const { data: existing, error: existingError } = await supabase
      .from("admin_users")
      .select("id")
      .ilike("username", username)
      .limit(1)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) throw new Error("Já existe um administrador com esse nome de usuário.");

    const password_hash = await hashAdminPassword(data.password);
    const { error } = await supabase.from("admin_users").insert({ username, password_hash });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPromotionEntries = createAdminServerFn("POST")
  .inputValidator((input: { promotion_id?: string }) => input)
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    let q = (supabase as any)
      .from("promotion_entries")
      .select("*, promotions(title)")
      .order("created_at", { ascending: false });
    if (data.promotion_id) q = q.eq("promotion_id", data.promotion_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows || [];
  });

export const deletePromotionEntry = createAdminServerFn("POST")
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
      const supabase = await getAdminSupabase();
    const { error } = await (supabase as any).from("promotion_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// getUploadUrl: usa adminClientTokenMiddleware (envia x-admin-token) + auth inline no handler.
// Nunca lança exceção — sempre retorna objeto com error string ou signedUrl válida.
// O browser faz o PUT direto ao Supabase (bypass do limite 4.5MB do Vercel).
export const getUploadUrl = createServerFn({ method: "POST" })
  .middleware([adminClientTokenMiddleware])
  .inputValidator((input: { filename: string; contentType: string }) => input)
  .handler(async ({ data }) => {
    try {
      const secret = await getAdminSecret();
      const token = getRequestHeader("x-admin-token");
      if (!secret || !(await verifyAdminToken(token, secret))) {
        return { signedUrl: null, publicUrl: null, error: "Sessão expirada — faça logout e login novamente" };
      }

      const supabase = await getAdminSupabase();
      const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `uploads/${Date.now()}-${safeName}`;
      const { data: result, error } = await supabase.storage.from("media").createSignedUploadUrl(path);
      if (error) return { signedUrl: null, publicUrl: null, error: `Storage: ${error.message}` };
      const publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl ?? null;
      return { signedUrl: result.signedUrl, publicUrl, error: null };
    } catch (e) {
      return { signedUrl: null, publicUrl: null, error: e instanceof Error ? e.message : "Erro interno" };
    }
  });

export const triggerAutoNewsManual = createAdminServerFn("POST").handler(async () => {
  try {
    const supabase = await getAdminSupabase();
    const { runNewsIngestWithClient } = await import("./news-auto.shared");
    const result = await runNewsIngestWithClient(supabase);
    return result ?? { inserted: 0, skipped: 0, total: 0 };
  } catch (e) {
    console.error("[triggerAutoNewsManual] erro:", e);
    const message = e instanceof Error ? e.message : "Falha ao buscar notícias";
    throw new Error(message);
  }
});

export const triggerAutoNewsForce = createAdminServerFn("POST").handler(async () => {
  try {
    const supabase = await getAdminSupabase();
    const { runNewsIngestWithClient } = await import("./news-auto.shared");
    const result = await runNewsIngestWithClient(supabase, { force: true });
    return result ?? { inserted: 0, skipped: 0, total: 0 };
  } catch (e) {
    console.error("[triggerAutoNewsForce] erro:", e);
    const message = e instanceof Error ? e.message : "Falha ao buscar notícias";
    throw new Error(message);
  }
});

export const getSiteSettings = createAdminServerFn("GET").handler(async () => {
  const supabase = await getAdminSupabase();
  const { data, error } = await (supabase as any).from("site_settings").select("*");
  if (error) throw new Error(error.message);

  const settings: Record<string, any> = {};
  data?.forEach((row: any) => {
    try {
      settings[row.setting_key] = JSON.parse(row.setting_value);
    } catch {
      settings[row.setting_key] = row.setting_value;
    }
  });
  return settings;
});

export const updateSiteSettings = createAdminServerFn("POST")
  .inputValidator((input: { key: string; value: any }) => input)
  .handler(async ({ data }) => {
    const supabase = await getAdminSupabase();

    const stringValue = typeof data.value === "object" ? JSON.stringify(data.value) : String(data.value);

    const { error } = await (supabase as any).from("site_settings").upsert(
      {
        setting_key: data.key,
        setting_value: stringValue,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" },
    );

    if (error) throw new Error(error.message);
    return { success: true };
});
