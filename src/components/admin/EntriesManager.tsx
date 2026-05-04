import { useCallback, useEffect, useState } from "react";
import {
  getPromotionEntries,
  deletePromotionEntry,
  getPromotions,
} from "@/lib/admin-api";
import { DownloadIcon, TrashIcon, UsersIcon } from "./icons";
import type { EntryRow } from "./types";

function formatCpf(v: string) {
  const d = (v || "").replace(/\D/g, "");
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : v;
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function downloadCsv(rows: EntryRow[], filename: string) {
  const headers = ["Nome", "Nascimento", "WhatsApp", "CPF", "Instagram", "Promoção", "Data"];
  const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) =>
      [
        r.full_name,
        formatDate(r.birth_date),
        r.whatsapp,
        formatCpf(r.cpf),
        r.instagram,
        r.promotions?.title || "",
        new Date(r.created_at).toLocaleString("pt-BR"),
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
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

  const load = useCallback(async () => {
    const [entries, p] = await Promise.all([
      getPromotionEntries({ data: filter ? { promotion_id: filter } : {} }),
      getPromotions(),
    ]);
    setRows(Array.isArray(entries) ? (entries as EntryRow[]) : []);
    const promoRows = Array.isArray(p) ? (p as { id: string; title: string }[]) : [];
    setPromos(promoRows.map((x) => ({ id: x.id, title: x.title })));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Excluir esta inscrição?")) return;
    await deletePromotionEntry({ data: { id } });
    load();
  };

  const exportCsv = () => {
    const safeRows = Array.isArray(rows) ? rows : [];

    if (safeRows.length === 0) {
      alert("Nada para exportar");
      return;
    }
    const promoTitle = filter
      ? promos.find((p) => p.id === filter)?.title || "promocao"
      : "todas";
    const safe = promoTitle.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    downloadCsv(safeRows, `inscritos_${safe}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const safeRows = Array.isArray(rows) ? rows : [];
  const safePromos = Array.isArray(promos) ? promos : [];

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <UsersIcon /> <span>Inscritos</span>
        </h1>
        <button className="admin-btn-primary" onClick={exportCsv}>
          <DownloadIcon /> Exportar CSV
        </button>
      </header>
      <div className="admin-form-card admin-filter-bar">
        <label>Filtrar por promoção</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todas</option>
          {safePromos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <span className="admin-counter">{safeRows.length} inscrição(ões)</span>
      </div>
      <div className="admin-list">
        {safeRows.length === 0 && <p className="admin-empty">Nenhuma inscrição ainda.</p>}
        {safeRows.map((r) => (
          <article key={r.id} className="admin-list-item">
            <div className="admin-list-info">
              <h4>{r.full_name}</h4>
              <p>
                WhatsApp: {r.whatsapp} · CPF: {formatCpf(r.cpf)}
              </p>
              <p>
                Instagram: {r.instagram}
                {r.birth_date ? ` · Nascimento: ${formatDate(r.birth_date)}` : ""}
              </p>
              <div className="admin-list-tags">
                <span className="admin-tag">{r.promotions?.title || "—"}</span>
                <span className="admin-tag tag-muted">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
            <div className="admin-list-actions">
              <button className="danger" onClick={() => remove(r.id)} title="Excluir">
                <TrashIcon />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
