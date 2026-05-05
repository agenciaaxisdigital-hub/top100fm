import { createServerFn } from "@tanstack/react-start";

async function getPublicSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

export const getActivePromotions = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getPublicSupabase();
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  return data || [];
});

// Lê TODAS as promoções para o painel admin (service role → sem RLS; fallback para público)
export const getAllPromotionsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  // 1. Tenta REST direto com service role key (bypassa RLS e qualquer issue do client JS)
  const supabaseUrl =
    process.env.MY_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    import.meta.env.VITE_MY_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL;
  const serviceKey =
    process.env.MY_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/promotions?select=*&order=display_order.asc,created_at.desc`,
        {
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) return rows;
      }
    } catch { /* cai no fallback */ }
  }

  // 2. Fallback: cliente público (sujeito a RLS — retorna apenas ativas)
  const supabase = await getPublicSupabase();
  const { data } = await supabase
    .from("promotions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  return data || [];
});

export const getPublishedNews = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getPublicSupabase();
  const { data } = await (supabase as any)
    .from("news")
    .select("*")
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("display_order", { ascending: true })
    .order("updated_at", { ascending: false });
  return data || [];
});

export const getProgramacao = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getPublicSupabase();
  const { data } = await (supabase as any)
    .from("programacao")
    .select("*")
    .eq("is_active", true)
    .neq("program_name", "__probe__")
    .order("day_of_week")
    .order("start_time");
  return (data || []) as ProgramacaoItem[];
});

export type ProgramacaoItem = {
  id: string;
  day_of_week: number;
  program_name: string;
  presenter: string | null;
  start_time: string;
  end_time: string;
  display_order: number;
  is_active: boolean;
  flyer_url: string | null;
};

export type PodcastItem = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
};

export const submitPromotionEntry = createServerFn({ method: "POST" })
  .inputValidator((input: { promotion_id: string; full_name: string; birth_date?: string; whatsapp: string; cpf: string; instagram: string; facebook?: string; cep?: string }) => {
    const trim = (s: string) => (s || "").trim();
    const data = {
      promotion_id: trim(input.promotion_id),
      full_name: trim(input.full_name),
      birth_date: trim(input.birth_date || ""),
      whatsapp: trim(input.whatsapp),
      cpf: trim(input.cpf).replace(/\D/g, ""),
      instagram: trim(input.instagram),
      facebook: trim(input.facebook || ""),
      cep: trim(input.cep || "").replace(/\D/g, ""),
    };
    if (!data.promotion_id) throw new Error("Promoção inválida");
    if (data.full_name.length < 3 || data.full_name.length > 120) throw new Error("Nome inválido");
    if (!data.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.birth_date)) throw new Error("Data de nascimento inválida");
    if (data.whatsapp.replace(/\D/g, "").length < 10) throw new Error("WhatsApp inválido");
    if (data.cpf.length !== 11) throw new Error("CPF deve ter 11 dígitos");
    if (!data.instagram || data.instagram.length > 80) throw new Error("Instagram obrigatório");
    if (data.cep && data.cep.length !== 8) throw new Error("CEP inválido (deve ter 8 dígitos)");
    return data;
  })
  .handler(async ({ data }) => {
    const supabase = await getPublicSupabase();
    const payload: any = {
      promotion_id: data.promotion_id,
      full_name: data.full_name,
      whatsapp: data.whatsapp,
      cpf: data.cpf,
      instagram: data.instagram,
      facebook: data.facebook || data.instagram,
      birth_date: data.birth_date,
      cep: data.cep || null,
    };
    let { error } = await (supabase as any).from("promotion_entries").insert(payload);
    // Fallback se colunas ainda não existem no schema
    if (error && /birth_date|cep/i.test(error.message || "")) {
      delete payload.birth_date;
      delete payload.cep;
      ({ error } = await (supabase as any).from("promotion_entries").insert(payload));
    }
    if (error) {
      if (error.code === "23505") throw new Error("Este CPF já foi cadastrado nesta promoção.");
      throw new Error(error.message);
    }
    return { success: true };
  });

export const getActivePodcasts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getPublicSupabase();
  const { data } = await (supabase as any)
    .from("podcasts")
    .select("*")
    .eq("is_active", true)
    .order("display_order")
    .order("created_at", { ascending: false });
  return (data || []) as PodcastItem[];
});

// ── Admin reads via REST (bypassa requireAdminMiddleware que falha em produção) ──

async function getServiceRoleClient() {
  const url =
    process.env.MY_SUPABASE_URL || process.env.SUPABASE_URL ||
    import.meta.env.VITE_MY_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.MY_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

async function restGet(table: string, query: string): Promise<any[] | null> {
  const { url, key } = await getServiceRoleClient();
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch { return null; }
}

export const getAllNewsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await restGet(
    "news",
    "select=*&order=is_pinned.desc,pinned_at.desc.nullslast,updated_at.desc",
  );
  if (rows) return rows;
  // Fallback: cliente público (só publicadas)
  const supabase = await getPublicSupabase();
  const { data } = await (supabase as any).from("news").select("*")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  return data || [];
});

export const triggerNewsIngestNow = createServerFn({ method: "POST" })
  .inputValidator((input: { force?: boolean }) => input)
  .handler(async ({ data }) => {
    const { url, key } = await getServiceRoleClient();
    if (!url || !key) throw new Error("Service role key não configurada no servidor");
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { runNewsIngestWithClient } = await import("./news-auto.shared");
    const result = await runNewsIngestWithClient(adminClient, { force: data.force });
    return result ?? { inserted: 0, skipped: 0, total: 0 };
  });

// Busca og:image para notícias auto-geradas que estão sem imagem
export const fixMissingNewsImages = createServerFn({ method: "POST" })
  .inputValidator((input: Record<string, never>) => input)
  .handler(async () => {
    const { url, key } = await getServiceRoleClient();
    if (!url || !key) throw new Error("Service role key não configurada");
    const { createClient } = await import("@supabase/supabase-js");
    const adminClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: rows } = await adminClient
      .from("news")
      .select("id, source_url")
      .eq("auto_generated", true)
      .or("image_url.is.null,image_url.eq.")
      .limit(20);

    if (!rows?.length) return { fixed: 0 };

    let fixed = 0;
    for (const row of rows) {
      if (!row.source_url) continue;
      try {
        const res = await fetch(row.source_url, {
          headers: { "User-Agent": "Mozilla/5.0 RadioBot/1.0" },
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) continue;
        const html = await res.text();
        const m =
          html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
          html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
        const img = m?.[1];
        if (!img) continue;
        const { error } = await adminClient.from("news").update({ image_url: img }).eq("id", row.id);
        if (!error) fixed++;
      } catch { /* skip */ }
    }
    return { fixed };
  });

// ── Entries Admin (bypassa requireAdminMiddleware) ──

export const getAllEntriesAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { url, key } = await getServiceRoleClient();
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/promotion_entries?select=*,promotions(title)&order=created_at.desc`,
      { headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" } },
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch { /* cai no fallback */ }
  return [];
});

export const getAllEntriesAdminFiltered = createServerFn({ method: "POST" })
  .inputValidator((input: { promotion_id?: string }) => input)
  .handler(async ({ data }) => {
    const { url, key } = await getServiceRoleClient();
    if (!url || !key) return [];
    const filter = data.promotion_id
      ? `&promotion_id=eq.${encodeURIComponent(data.promotion_id)}`
      : "";
    try {
      const res = await fetch(
        `${url}/rest/v1/promotion_entries?select=*,promotions(title)&order=created_at.desc${filter}`,
        { headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" } },
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) return rows;
      }
    } catch { /* fallback */ }
    return [];
  });

// ── Site Settings (Public) ──

export const getPublicSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getPublicSupabase();
  const { data } = await (supabase as any).from("site_settings").select("*");

  const settings: Record<string, any> = {};
  (data || []).forEach((row: any) => {
    try {
      settings[row.setting_key] = JSON.parse(row.setting_value);
    } catch {
      settings[row.setting_key] = row.setting_value;
    }
  });
  return settings;
});

export type LiveStreamStatus = {
  active: boolean;
  url: string | null;
  title: string | null;
};

export const getLiveStream = createServerFn({ method: "GET" }).handler(async (): Promise<LiveStreamStatus> => {
  const supabase = await getPublicSupabase();
  const { data } = await (supabase as any)
    .from("site_settings")
    .select("setting_key, setting_value")
    .in("setting_key", ["live_active", "live_url", "live_title"]);

  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => { map[row.setting_key] = row.setting_value; });

  return {
    active: map["live_active"] === "true",
    url: map["live_url"] || null,
    title: map["live_title"] || null,
  };
});
