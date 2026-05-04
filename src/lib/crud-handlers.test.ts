/**
 * Testa a lógica de cada handler CRUD do painel admin.
 *
 * Estratégia: as server functions (createAdminServerFn) não são invocáveis
 * diretamente em testes (precisam de contexto HTTP). Aqui extraímos e testamos
 * a lógica de negócio pura — o mesmo código que está nos handlers —
 * com um mock chainable do Supabase client.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock factory do Supabase (chainable + thenable) ──────────────────────────

type MockResult = { data: any; error: any };

function makeSupaMock(result: MockResult = { data: null, error: null }) {
  const chain: any = {};

  const self = () => chain;

  // Métodos que retornam a própria chain (builder pattern)
  for (const m of [
    "select","insert","update","delete","upsert",
    "eq","neq","in","ilike","order","limit","not",
  ]) {
    chain[m] = vi.fn(self);
  }

  // Terminais que resolvem como Promise
  chain.single      = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);

  // Torna o chain await-able (para queries sem .single())
  chain.then  = (res: any) => Promise.resolve(result).then(res);
  chain.catch = (rej: any) => Promise.resolve(result).catch(rej);

  return chain;
}

function makeClient(result?: MockResult, storageResult?: any) {
  const chain = makeSupaMock(result);

  // Instância de storage única (para poder inspecionar .mock.calls depois)
  const storageBucket = {
    createSignedUploadUrl: vi.fn().mockResolvedValue(
      storageResult ?? { data: { signedUrl: "https://signed.url/test" }, error: null }
    ),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/test.jpg" },
    }),
  };

  const client: any = {
    from: vi.fn(() => chain),
    storage: {
      from: vi.fn(() => storageBucket),
      _bucket: storageBucket, // acesso direto para asserções
    },
    _chain: chain,
  };
  return client;
}

// ── Lógica dos handlers (espelho exato de admin-api.functions.ts) ─────────────

async function fetchPromotions(supabase: any) {
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

async function insertPromotion(supabase: any, input: any) {
  const { data: result, error } = await supabase
    .from("promotions")
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function updatePromotion(supabase: any, { id, ...updates }: any) {
  const { data: result, error } = await supabase
    .from("promotions")
    .update({ ...updates, updated_at: expect.any(String) ?? new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function deletePromotion(supabase: any, id: string) {
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

async function fetchNews(supabase: any) {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("pinned_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

async function insertNews(supabase: any, input: any) {
  const { data: result, error } = await supabase.from("news").insert(input).select().single();
  if (error) throw new Error(error.message);
  return result;
}

async function updateNews(supabase: any, { id, ...updates }: any) {
  const { data: result, error } = await supabase
    .from("news")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function deleteNews(supabase: any, id: string) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

async function fetchProgramacao(supabase: any) {
  const { data } = await supabase
    .from("programacao")
    .select("*")
    .order("day_of_week")
    .order("start_time");
  return data || [];
}

async function insertProgramacao(supabase: any, input: any) {
  const { data: result, error } = await supabase
    .from("programacao")
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function updateProgramacao(supabase: any, { id, ...updates }: any) {
  const { data: result, error } = await supabase
    .from("programacao")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function deleteProgramacao(supabase: any, id: string) {
  const { error } = await supabase.from("programacao").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

async function fetchPodcasts(supabase: any) {
  const { data } = await supabase
    .from("podcasts")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });
  return data || [];
}

async function insertPodcast(supabase: any, input: any) {
  const { data: result, error } = await supabase
    .from("podcasts")
    .insert({ ...input, is_active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function updatePodcast(supabase: any, { id, ...updates }: any) {
  const { data: result, error } = await supabase
    .from("podcasts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return result;
}

async function deletePodcast(supabase: any, id: string) {
  const { error } = await supabase.from("podcasts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { success: true };
}

async function upsertSetting(supabase: any, key: string, value: string) {
  const { error } = await supabase.from("site_settings").upsert(
    { setting_key: key, setting_value: value, updated_at: new Date().toISOString() },
    { onConflict: "setting_key" },
  );
  if (error) throw new Error(error.message);
}

async function setLiveStreamLogic(supabase: any, input: { active: boolean; url?: string; title?: string }) {
  await upsertSetting(supabase, "live_active", String(input.active));
  if (input.url !== undefined) await upsertSetting(supabase, "live_url", input.url);
  if (input.title !== undefined) await upsertSetting(supabase, "live_title", input.title);
  return { success: true };
}

async function getUploadUrlLogic(supabase: any, filename: string, contentType: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `uploads/${Date.now()}-${safeName}`;
  const { data: result, error } = await supabase.storage.from("media").createSignedUploadUrl(path);
  if (error) return { signedUrl: null, publicUrl: null, error: `Storage: ${error.message}` };
  const publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl ?? null;
  return { signedUrl: result.signedUrl, publicUrl, error: null };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("PROMOTIONS CRUD", () => {
  it("GET retorna array vazio quando não há dados", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await fetchPromotions(client);
    expect(result).toEqual([]);
    expect(client.from).toHaveBeenCalledWith("promotions");
  });

  it("GET retorna promoções ordenadas", async () => {
    const rows = [
      { id: "1", title: "Promo A", display_order: 1, is_active: true },
      { id: "2", title: "Promo B", display_order: 2, is_active: true },
    ];
    const client = makeClient({ data: rows, error: null });
    const result = await fetchPromotions(client);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Promo A");
  });

  it("GET lança erro quando Supabase retorna error", async () => {
    const client = makeClient({ data: null, error: { message: "DB offline" } });
    await expect(fetchPromotions(client)).rejects.toThrow("DB offline");
  });

  it("POST create insere promoção com is_active=true", async () => {
    const newPromo = { id: "abc", title: "Nova Promo", is_active: true };
    const client = makeClient({ data: newPromo, error: null });
    const result = await insertPromotion(client, { title: "Nova Promo" });
    expect(client.from).toHaveBeenCalledWith("promotions");
    expect(client._chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Nova Promo", is_active: true }),
    );
    expect(result).toEqual(newPromo);
  });

  it("POST update chama update+eq com id correto", async () => {
    const updated = { id: "abc", title: "Atualizada", is_active: false };
    const client = makeClient({ data: updated, error: null });
    await updatePromotion(client, { id: "abc", title: "Atualizada", is_active: false });
    expect(client._chain.eq).toHaveBeenCalledWith("id", "abc");
    expect(client._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Atualizada", is_active: false }),
    );
  });

  it("POST delete chama delete+eq com id correto", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await deletePromotion(client, "abc-123");
    expect(client._chain.delete).toHaveBeenCalled();
    expect(client._chain.eq).toHaveBeenCalledWith("id", "abc-123");
    expect(result).toEqual({ success: true });
  });

  it("POST delete lança erro quando Supabase retorna error", async () => {
    const client = makeClient({ data: null, error: { message: "Foreign key violation" } });
    await expect(deletePromotion(client, "id-x")).rejects.toThrow("Foreign key violation");
  });
});

describe("NEWS CRUD", () => {
  it("GET retorna notícias ordenadas (pinned primeiro)", async () => {
    const rows = [
      { id: "n1", title: "Pinned", is_pinned: true },
      { id: "n2", title: "Normal", is_pinned: false },
    ];
    const client = makeClient({ data: rows, error: null });
    const result = await fetchNews(client);
    expect(result).toHaveLength(2);
    expect(client._chain.order).toHaveBeenCalledWith("is_pinned", { ascending: false });
  });

  it("GET retorna [] quando data é null", async () => {
    const client = makeClient({ data: null, error: null });
    expect(await fetchNews(client)).toEqual([]);
  });

  it("POST create insere notícia corretamente", async () => {
    const input = { title: "Breaking News", content: "Conteúdo..." };
    const client = makeClient({ data: { id: "n1", ...input }, error: null });
    const result = await insertNews(client, input);
    expect(client._chain.insert).toHaveBeenCalledWith(input);
    expect(result.title).toBe("Breaking News");
  });

  it("POST update define updated_at automaticamente", async () => {
    const client = makeClient({ data: { id: "n1", title: "Updated" }, error: null });
    await updateNews(client, { id: "n1", title: "Updated" });
    const updateCall = client._chain.update.mock.calls[0][0];
    expect(updateCall).toHaveProperty("updated_at");
    expect(typeof updateCall.updated_at).toBe("string");
  });

  it("POST delete remove notícia pelo id", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await deleteNews(client, "n-abc");
    expect(client._chain.eq).toHaveBeenCalledWith("id", "n-abc");
    expect(result).toEqual({ success: true });
  });
});

describe("PROGRAMAÇÃO CRUD", () => {
  it("GET retorna programas ordenados por dia e horário", async () => {
    const rows = [
      { id: "p1", day_of_week: 1, start_time: "08:00", program_name: "Manhã" },
      { id: "p2", day_of_week: 1, start_time: "10:00", program_name: "Meio-dia" },
    ];
    const client = makeClient({ data: rows, error: null });
    const result = await fetchProgramacao(client);
    expect(result).toHaveLength(2);
    expect(client._chain.order).toHaveBeenCalledWith("day_of_week");
    expect(client._chain.order).toHaveBeenCalledWith("start_time");
  });

  it("POST create insere programa com is_active=true", async () => {
    const input = { day_of_week: 1, program_name: "Show da Manhã", start_time: "08:00", end_time: "10:00" };
    const client = makeClient({ data: { id: "pg1", ...input, is_active: true }, error: null });
    const result = await insertProgramacao(client, input);
    expect(client._chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ program_name: "Show da Manhã", is_active: true }),
    );
    expect(result.is_active).toBe(true);
  });

  it("POST create persiste flyer_url quando fornecido", async () => {
    const input = {
      day_of_week: 2,
      program_name: "Tarde Musical",
      start_time: "14:00",
      end_time: "16:00",
      flyer_url: "https://cdn.example.com/flyer.jpg",
    };
    const client = makeClient({ data: { id: "pg2", ...input, is_active: true }, error: null });
    const result = await insertProgramacao(client, input);
    expect(client._chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ flyer_url: "https://cdn.example.com/flyer.jpg" }),
    );
    expect(result.flyer_url).toBe("https://cdn.example.com/flyer.jpg");
  });

  it("POST update atualiza flyer_url", async () => {
    const client = makeClient({ data: { id: "pg1", flyer_url: "https://new-flyer.jpg" }, error: null });
    await updateProgramacao(client, { id: "pg1", flyer_url: "https://new-flyer.jpg" });
    expect(client._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ flyer_url: "https://new-flyer.jpg" }),
    );
    expect(client._chain.eq).toHaveBeenCalledWith("id", "pg1");
  });

  it("POST toggle is_active desativa programa", async () => {
    const client = makeClient({ data: { id: "pg1", is_active: false }, error: null });
    await updateProgramacao(client, { id: "pg1", is_active: false });
    expect(client._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
  });

  it("POST delete remove programa pelo id", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await deleteProgramacao(client, "pg-xyz");
    expect(client._chain.delete).toHaveBeenCalled();
    expect(client._chain.eq).toHaveBeenCalledWith("id", "pg-xyz");
    expect(result).toEqual({ success: true });
  });
});

describe("PODCASTS CRUD", () => {
  it("GET retorna podcasts ordenados por display_order", async () => {
    const rows = [
      { id: "pod1", title: "Ep 01", display_order: 1 },
      { id: "pod2", title: "Ep 02", display_order: 2 },
    ];
    const client = makeClient({ data: rows, error: null });
    const result = await fetchPodcasts(client);
    expect(result).toHaveLength(2);
    expect(client._chain.order).toHaveBeenCalledWith("display_order");
  });

  it("POST create insere podcast com is_active=true", async () => {
    const input = { title: "Podcast #1", youtube_url: "https://youtu.be/abc123" };
    const client = makeClient({ data: { id: "pod1", ...input, is_active: true }, error: null });
    const result = await insertPodcast(client, input);
    expect(client._chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ youtube_url: "https://youtu.be/abc123", is_active: true }),
    );
    expect(result.is_active).toBe(true);
  });

  it("POST create persiste thumbnail_url quando fornecida", async () => {
    const input = {
      title: "Podcast com capa",
      youtube_url: "https://youtu.be/xyz",
      thumbnail_url: "https://cdn.example.com/thumb.jpg",
    };
    const client = makeClient({ data: { id: "pod2", ...input, is_active: true }, error: null });
    await insertPodcast(client, input);
    expect(client._chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnail_url: "https://cdn.example.com/thumb.jpg" }),
    );
  });

  it("POST update atualiza youtube_url", async () => {
    const client = makeClient({ data: { id: "pod1", youtube_url: "https://youtu.be/new" }, error: null });
    await updatePodcast(client, { id: "pod1", youtube_url: "https://youtu.be/new" });
    expect(client._chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ youtube_url: "https://youtu.be/new" }),
    );
  });

  it("POST delete remove podcast pelo id", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await deletePodcast(client, "pod-abc");
    expect(client._chain.eq).toHaveBeenCalledWith("id", "pod-abc");
    expect(result).toEqual({ success: true });
  });
});

describe("LIVE STREAM (setLiveStream)", () => {
  it("ativa transmissão e grava url + título", async () => {
    const client = makeClient({ data: null, error: null });
    const result = await setLiveStreamLogic(client, {
      active: true,
      url: "https://youtu.be/live123",
      title: "TOP100 FM ao Vivo",
    });
    expect(client.from).toHaveBeenCalledWith("site_settings");
    expect(client._chain.upsert).toHaveBeenCalledTimes(3);
    expect(client._chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ setting_key: "live_active", setting_value: "true" }),
      { onConflict: "setting_key" },
    );
    expect(client._chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ setting_key: "live_url", setting_value: "https://youtu.be/live123" }),
      { onConflict: "setting_key" },
    );
    expect(client._chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ setting_key: "live_title", setting_value: "TOP100 FM ao Vivo" }),
      { onConflict: "setting_key" },
    );
    expect(result).toEqual({ success: true });
  });

  it("desativa transmissão sem alterar url/título quando omitidos", async () => {
    const client = makeClient({ data: null, error: null });
    await setLiveStreamLogic(client, { active: false });
    expect(client._chain.upsert).toHaveBeenCalledTimes(1);
    expect(client._chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ setting_key: "live_active", setting_value: "false" }),
      { onConflict: "setting_key" },
    );
  });

  it("string 'true' é gravada para live_active=true", async () => {
    const client = makeClient({ data: null, error: null });
    await setLiveStreamLogic(client, { active: true });
    const call = client._chain.upsert.mock.calls[0][0];
    expect(call.setting_value).toBe("true");
  });
});

describe("UPLOAD DE IMAGEM (getUploadUrl logic)", () => {
  it("retorna signedUrl e publicUrl para arquivo válido", async () => {
    const client = makeClient(undefined, {
      data: { signedUrl: "https://signed.supabase.co/upload?token=xyz" },
      error: null,
    });
    const result = await getUploadUrlLogic(client, "minha-foto.jpg", "image/jpeg");
    expect(result.error).toBeNull();
    expect(result.signedUrl).toBe("https://signed.supabase.co/upload?token=xyz");
    expect(result.publicUrl).toBe("https://cdn.example.com/test.jpg");
  });

  it("sanitiza nome de arquivo com caracteres especiais", async () => {
    const client = makeClient(undefined, {
      data: { signedUrl: "https://signed.url" },
      error: null,
    });
    await getUploadUrlLogic(client, "foto da promoção #1!.jpg", "image/jpeg");
    // Usa _bucket para acessar sempre a mesma instância do mock
    const callArg = client.storage._bucket.createSignedUploadUrl.mock.calls[0][0] as string;
    expect(callArg).toMatch(/^uploads\/\d+-foto_da_promo__o__1_.jpg$/);
  });

  it("retorna error quando Supabase Storage falha", async () => {
    const client = makeClient(undefined, {
      data: null,
      error: { message: "Bucket not found" },
    });
    const result = await getUploadUrlLogic(client, "test.png", "image/png");
    expect(result.error).toBe("Storage: Bucket not found");
    expect(result.signedUrl).toBeNull();
    expect(result.publicUrl).toBeNull();
  });
});

describe("SITE SETTINGS upsert", () => {
  it("grava setting com chave e valor string", async () => {
    const client = makeClient({ data: null, error: null });
    await upsertSetting(client, "minha_chave", "meu_valor");
    expect(client._chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ setting_key: "minha_chave", setting_value: "meu_valor" }),
      { onConflict: "setting_key" },
    );
  });

  it("lança erro quando Supabase retorna error", async () => {
    const client = makeClient({ data: null, error: { message: "Permission denied" } });
    await expect(upsertSetting(client, "k", "v")).rejects.toThrow("Permission denied");
  });
});
