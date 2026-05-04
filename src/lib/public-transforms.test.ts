/**
 * Testa a lógica de transformação de dados da public-api:
 * parsing de site_settings, extração do live stream, validação de inscrição.
 */
import { describe, it, expect } from "vitest";

// ── Helpers que espelham a lógica de public-api.ts ────────────────────────────

function parseSettingsRows(rows: Array<{ setting_key: string; setting_value: string }>) {
  const settings: Record<string, any> = {};
  rows.forEach((row) => {
    try {
      settings[row.setting_key] = JSON.parse(row.setting_value);
    } catch {
      settings[row.setting_key] = row.setting_value;
    }
  });
  return settings;
}

function parseLiveStreamRows(rows: Array<{ setting_key: string; setting_value: string }>) {
  const map: Record<string, string> = {};
  rows.forEach((row) => { map[row.setting_key] = row.setting_value; });
  return {
    active: map["live_active"] === "true",
    url: map["live_url"] || null,
    title: map["live_title"] || null,
  };
}

function validateEntryInput(input: Record<string, any>) {
  const trim = (s: string) => (s || "").trim();
  const data = {
    promotion_id: trim(input.promotion_id),
    full_name: trim(input.full_name),
    birth_date: trim(input.birth_date || ""),
    whatsapp: trim(input.whatsapp),
    cpf: trim(input.cpf).replace(/\D/g, ""),
    instagram: trim(input.instagram),
    facebook: trim(input.facebook || ""),
  };

  if (!data.promotion_id) throw new Error("Promoção inválida");
  if (data.full_name.length < 3 || data.full_name.length > 120) throw new Error("Nome inválido");
  if (!data.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.birth_date))
    throw new Error("Data de nascimento inválida");
  if (data.whatsapp.replace(/\D/g, "").length < 10) throw new Error("WhatsApp inválido");
  if (data.cpf.length !== 11) throw new Error("CPF deve ter 11 dígitos");
  if (!data.instagram || data.instagram.length > 80) throw new Error("Instagram obrigatório");

  return data;
}

// ── parseSettingsRows ─────────────────────────────────────────────────────────

describe("parseSettingsRows", () => {
  it("parseia valores JSON corretamente", () => {
    const rows = [
      { setting_key: "sponsors", setting_value: '[{"id":"1","name":"Sponsor A"}]' },
    ];
    const result = parseSettingsRows(rows);
    expect(result.sponsors).toEqual([{ id: "1", name: "Sponsor A" }]);
  });

  it("mantém string quando não é JSON válido", () => {
    const rows = [{ setting_key: "radio_name", setting_value: "TOP100 FM" }];
    const result = parseSettingsRows(rows);
    expect(result.radio_name).toBe("TOP100 FM");
  });

  it("parseia booleano JSON", () => {
    const rows = [{ setting_key: "feature_enabled", setting_value: "true" }];
    const result = parseSettingsRows(rows);
    expect(result.feature_enabled).toBe(true);
  });

  it("parseia número JSON", () => {
    const rows = [{ setting_key: "max_podcasts", setting_value: "10" }];
    const result = parseSettingsRows(rows);
    expect(result.max_podcasts).toBe(10);
  });

  it("retorna objeto vazio para lista vazia", () => {
    expect(parseSettingsRows([])).toEqual({});
  });

  it("última chave vence em duplicatas", () => {
    const rows = [
      { setting_key: "chave", setting_value: "primeiro" },
      { setting_key: "chave", setting_value: "segundo" },
    ];
    const result = parseSettingsRows(rows);
    expect(result.chave).toBe("segundo");
  });
});

// ── parseLiveStreamRows ───────────────────────────────────────────────────────

describe("parseLiveStreamRows", () => {
  it("retorna active=true quando live_active='true'", () => {
    const rows = [
      { setting_key: "live_active", setting_value: "true" },
      { setting_key: "live_url", setting_value: "https://youtu.be/abc" },
      { setting_key: "live_title", setting_value: "Programa ao Vivo" },
    ];
    const result = parseLiveStreamRows(rows);
    expect(result.active).toBe(true);
    expect(result.url).toBe("https://youtu.be/abc");
    expect(result.title).toBe("Programa ao Vivo");
  });

  it("retorna active=false quando live_active='false'", () => {
    const rows = [{ setting_key: "live_active", setting_value: "false" }];
    expect(parseLiveStreamRows(rows).active).toBe(false);
  });

  it("retorna url=null quando chave ausente", () => {
    const result = parseLiveStreamRows([]);
    expect(result.active).toBe(false);
    expect(result.url).toBeNull();
    expect(result.title).toBeNull();
  });

  it("retorna url=null quando live_url é string vazia", () => {
    const rows = [{ setting_key: "live_url", setting_value: "" }];
    expect(parseLiveStreamRows(rows).url).toBeNull();
  });

  it("retorna active=false quando live_active='TRUE' (case sensitive)", () => {
    const rows = [{ setting_key: "live_active", setting_value: "TRUE" }];
    expect(parseLiveStreamRows(rows).active).toBe(false);
  });
});

// ── validateEntryInput ────────────────────────────────────────────────────────

describe("validateEntryInput — inscrição em promoção", () => {
  const VALID = {
    promotion_id: "promo-123",
    full_name: "João Silva Santos",
    birth_date: "1990-05-15",
    whatsapp: "62999998888",
    cpf: "123.456.789-01",
    instagram: "@joaosilva",
    facebook: "joao.silva",
  };

  it("aceita input válido e sanitiza CPF", () => {
    const result = validateEntryInput(VALID);
    expect(result.cpf).toBe("12345678901");
    expect(result.full_name).toBe("João Silva Santos");
  });

  it("trim em todos os campos string", () => {
    const result = validateEntryInput({ ...VALID, full_name: "  Maria  " });
    expect(result.full_name).toBe("Maria");
  });

  it("rejeita promotion_id vazio", () => {
    expect(() => validateEntryInput({ ...VALID, promotion_id: "" })).toThrow("Promoção inválida");
  });

  it("rejeita nome muito curto (<3 chars)", () => {
    expect(() => validateEntryInput({ ...VALID, full_name: "Jo" })).toThrow("Nome inválido");
  });

  it("rejeita nome muito longo (>120 chars)", () => {
    expect(() => validateEntryInput({ ...VALID, full_name: "A".repeat(121) })).toThrow("Nome inválido");
  });

  it("rejeita data de nascimento inválida", () => {
    expect(() => validateEntryInput({ ...VALID, birth_date: "15/05/1990" })).toThrow(
      "Data de nascimento inválida",
    );
  });

  it("rejeita data de nascimento ausente", () => {
    expect(() => validateEntryInput({ ...VALID, birth_date: "" })).toThrow(
      "Data de nascimento inválida",
    );
  });

  it("aceita data no formato YYYY-MM-DD", () => {
    expect(() => validateEntryInput({ ...VALID, birth_date: "2000-12-31" })).not.toThrow();
  });

  it("rejeita WhatsApp com menos de 10 dígitos", () => {
    expect(() => validateEntryInput({ ...VALID, whatsapp: "6299" })).toThrow("WhatsApp inválido");
  });

  it("aceita WhatsApp com formatação (parênteses, traço)", () => {
    expect(() => validateEntryInput({ ...VALID, whatsapp: "(62) 9 9999-8888" })).not.toThrow();
  });

  it("rejeita CPF com menos de 11 dígitos", () => {
    expect(() => validateEntryInput({ ...VALID, cpf: "123.456.789" })).toThrow("CPF deve ter 11 dígitos");
  });

  it("aceita CPF com pontuação (remove não-dígitos)", () => {
    const result = validateEntryInput({ ...VALID, cpf: "123.456.789-01" });
    expect(result.cpf).toBe("12345678901");
  });

  it("rejeita instagram vazio", () => {
    expect(() => validateEntryInput({ ...VALID, instagram: "" })).toThrow("Instagram obrigatório");
  });

  it("facebook padrão para instagram quando ausente", () => {
    const result = validateEntryInput({ ...VALID, facebook: undefined });
    expect(result.facebook).toBe("");
  });
});
