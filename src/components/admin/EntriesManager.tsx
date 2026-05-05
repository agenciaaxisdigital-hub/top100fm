import { useCallback, useEffect, useState } from "react";
import { deletePromotionEntry } from "@/lib/admin-api";
import { getAllEntriesAdminFiltered } from "@/lib/public-api";
import { getAllPromotionsAdmin } from "@/lib/public-api";
import { DownloadIcon, TrashIcon, UsersIcon } from "./icons";
import type { EntryRow } from "./types";

function formatCpf(v: string) {
  const d = (v || "").replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : v;
}

function formatCep(v: string | null | undefined) {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : v;
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

type CepInfo = { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };

async function fetchCep(cep: string): Promise<CepInfo | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.erro ? null : data;
  } catch { return null; }
}

function formatAddress(info: CepInfo) {
  const parts = [info.logradouro, info.bairro].filter(Boolean).join(", ");
  const city = [info.localidade, info.uf].filter(Boolean).join("/");
  return [parts, city].filter(Boolean).join(" — ");
}

function downloadCsv(rows: EntryRow[], cepMap: Record<string, CepInfo | null>, filename: string) {
  const headers = ["Nome", "Nascimento", "WhatsApp", "CPF", "Instagram", "CEP", "Endereço", "Promoção", "Data"];
  const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => {
      const cepInfo = r.cep ? cepMap[r.cep.replace(/\D/g, "")] : null;
      return [
        r.full_name,
        formatDate(r.birth_date),
        r.whatsapp,
        formatCpf(r.cpf),
        r.instagram,
        formatCep(r.cep) || "",
        cepInfo ? formatAddress(cepInfo) : "",
        r.promotions?.title || "",
        new Date(r.created_at).toLocaleString("pt-BR"),
      ].map(escape).join(",");
    }),
  ];
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function EntriesManager() {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [promos, setPromos] = useState<{ id: string; title: string }[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [cepMap, setCepMap] = useState<Record<string, CepInfo | null>>({});
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const [entries, p] = await Promise.all([
        getAllEntriesAdminFiltered({ data: filter ? { promotion_id: filter } : {} }),
        getAllPromotionsAdmin(),
      ]);
      const safeEntries = Array.isArray(entries) ? (entries as EntryRow[]) : [];
      setRows(safeEntries);
      const promoRows = Array.isArray(p) ? (p as { id: string; title: string }[]) : [];
      setPromos(promoRows.map((x) => ({ id: x.id, title: x.title })));

      // Resolve CEPs únicos
      const uniqueCeps = [...new Set(safeEntries.map((r) => r.cep?.replace(/\D/g, "")).filter(Boolean) as string[])];
      if (uniqueCeps.length > 0) {
        const results = await Promise.all(uniqueCeps.map((c) => fetchCep(c).then((info) => [c, info] as const)));
        setCepMap(Object.fromEntries(results));
      }
    } catch (e: any) {
      setLoadErr(e?.message || "Erro ao carregar inscrições");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta inscrição?")) return;
    await deletePromotionEntry({ data: { id } });
    load();
  };

  const exportCsv = () => {
    if (rows.length === 0) { alert("Nada para exportar"); return; }
    const promoTitle = filter ? promos.find((p) => p.id === filter)?.title || "promocao" : "todas";
    const safe = promoTitle.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    downloadCsv(rows, cepMap, `inscritos_${safe}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <UsersIcon /> <span>Inscritos</span>
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="admin-btn-secondary" onClick={load} disabled={loading}>
            {loading ? "⟳" : "↻"} Atualizar
          </button>
          <button className="admin-btn-primary" onClick={exportCsv}>
            <DownloadIcon /> Exportar CSV
          </button>
        </div>
      </header>

      <div className="admin-form-card admin-filter-bar">
        <label>Filtrar por promoção</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todas</option>
          {promos.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <span className="admin-counter">{rows.length} inscrição(ões)</span>
      </div>

      <div className="admin-list">
        {loadErr && (
          <div className="admin-error">
            <span>⚠ {loadErr}</span>
            <button className="admin-btn-secondary" onClick={load}>Tentar novamente</button>
          </div>
        )}
        {!loadErr && rows.length === 0 && !loading && (
          <p className="admin-empty">Nenhuma inscrição ainda.</p>
        )}
        {rows.map((r) => {
          const cepClean = r.cep?.replace(/\D/g, "") || "";
          const cepInfo = cepClean ? cepMap[cepClean] : null;
          const address = cepInfo ? formatAddress(cepInfo) : null;
          const cepStatus = !cepClean
            ? "—"
            : cepMap[cepClean] === undefined
            ? "carregando..."
            : cepMap[cepClean] === null
            ? "CEP não encontrado"
            : address || "—";
          return (
            <article key={r.id} className="admin-list-item" style={{ alignItems: "flex-start", flexDirection: "column", gap: 0, padding: "16px 18px" }}>
              {/* Cabeçalho */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{r.full_name}</h4>
                  <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="admin-tag" style={{ margin: 0 }}>{r.promotions?.title || "—"}</span>
                    <span className="admin-tag tag-muted" style={{ margin: 0 }}>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <button className="danger" onClick={() => remove(r.id)} title="Excluir" style={{ flexShrink: 0, marginLeft: 12 }}>
                  <TrashIcon />
                </button>
              </div>

              {/* Dados pessoais */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "6px 20px", fontSize: 13, width: "100%" }}>
                <div>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>WhatsApp</span>
                  <div style={{ color: "#111827", fontWeight: 500 }}>{r.whatsapp}</div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>CPF</span>
                  <div style={{ color: "#111827", fontWeight: 500 }}>{formatCpf(r.cpf)}</div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Instagram</span>
                  <div style={{ color: "#111827", fontWeight: 500 }}>{r.instagram || "—"}</div>
                </div>
                <div>
                  <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Nascimento</span>
                  <div style={{ color: "#111827", fontWeight: 500 }}>{r.birth_date ? formatDate(r.birth_date) : "—"}</div>
                </div>
              </div>

              {/* CEP + Endereço */}
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#f4f6fb", borderRadius: 8, width: "100%", boxSizing: "border-box" }}>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div>
                    <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>CEP</span>
                    <div style={{ color: "#111827", fontWeight: 500, fontSize: 13 }}>{r.cep ? formatCep(r.cep) : "—"}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Endereço</span>
                    <div style={{ color: cepMap[cepClean] === null ? "#9ca3af" : "#111827", fontWeight: 500, fontSize: 13 }}>
                      {cepStatus}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
