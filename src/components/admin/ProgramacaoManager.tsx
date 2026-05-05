import { useCallback, useEffect, useState } from "react";
import {
  getProgramacaoAdmin,
  createProgramacao,
  updateProgramacao,
  deleteProgramacao,
} from "@/lib/admin-api";
import { ImageUploader } from "./ImageUploader";
import { CalendarIcon, PencilIcon, PlusIcon, PowerIcon, TrashIcon } from "./icons";
import { DAYS_LABELS, type ProgItem } from "./types";

const EMPTY = {
  day_of_week: 1,
  program_name: "",
  presenter: "",
  start_time: "08:00",
  end_time: "10:00",
  display_order: 0,
  flyer_url: "",
};

export function ProgramacaoManager() {
  const [items, setItems] = useState<ProgItem[]>([]);
  const [editing, setEditing] = useState<ProgItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const data = await getProgramacaoAdmin();
      if (data == null) { setLoadErr("Sessão expirada — faça logout e login novamente"); return; }
      setItems(Array.isArray(data) ? (data as ProgItem[]) : []);
    } catch (e: any) {
      setLoadErr(e?.message || "Erro ao carregar programação");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.program_name.trim()) {
      alert("Informe o nome do programa");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateProgramacao({ data: { id: editing.id, ...form } });
      else await createProgramacao({ data: form });
      reset();
      load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: ProgItem) => {
    setForm({
      day_of_week: p.day_of_week,
      program_name: p.program_name,
      presenter: p.presenter || "",
      start_time: p.start_time.slice(0, 5),
      end_time: p.end_time.slice(0, 5),
      display_order: p.display_order ?? 0,
      flyer_url: p.flyer_url || "",
    });
    setEditing(p);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este programa?")) return;
    await deleteProgramacao({ data: { id } });
    load();
  };

  const toggle = async (p: ProgItem) => {
    await updateProgramacao({ data: { id: p.id, is_active: !p.is_active } });
    load();
  };

  const safeItems = Array.isArray(items) ? items : [];

  const grouped = DAYS_LABELS.map((label, idx) => ({
    label,
    idx,
    items: safeItems
      .filter((i) => i.day_of_week === idx)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <CalendarIcon /> <span>Programação</span>
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="admin-btn-secondary" onClick={load} disabled={loading} title="Atualizar lista">
            {loading ? "⟳" : "↻"} Atualizar
          </button>
          <button className="admin-btn-primary" onClick={() => { reset(); setShowForm(true); }}>
            <PlusIcon /> Novo programa
          </button>
        </div>
      </header>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? "Editar programa" : "Novo programa"}</h3>
          <div className="admin-row">
            <div className="admin-field">
              <label>Dia da semana</label>
              <select
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
              >
                {DAYS_LABELS.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Ordem</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="admin-field">
            <label>Nome do programa *</label>
            <input
              value={form.program_name}
              onChange={(e) => setForm({ ...form, program_name: e.target.value })}
              placeholder="Ex: Madrugada Positiva"
              maxLength={120}
            />
          </div>
          <div className="admin-field">
            <label>Apresentador / Programador</label>
            <input
              value={form.presenter}
              onChange={(e) => setForm({ ...form, presenter: e.target.value })}
              placeholder="Ex: Programador Positiva"
              maxLength={120}
            />
          </div>
          <div className="admin-row">
            <div className="admin-field">
              <label>Início</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="admin-field">
              <label>Fim</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="admin-field">
            <label>Flyer / arte do programa (opcional)</label>
            {form.flyer_url && (
              <img src={form.flyer_url} alt="Flyer" className="admin-preview-img" />
            )}
            <ImageUploader onUploaded={(url) => setForm({ ...form, flyer_url: url })} />
            <input
              value={form.flyer_url}
              onChange={(e) => setForm({ ...form, flyer_url: e.target.value })}
              placeholder="ou cole uma URL de imagem"
            />
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar programa"}
            </button>
            <button className="admin-btn-secondary" onClick={reset}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {loadErr && (
          <div className="admin-error">
            <span>⚠ {loadErr}</span>
            <button className="admin-btn-secondary" onClick={load}>Tentar novamente</button>
          </div>
        )}
        {!loadErr && safeItems.length === 0 && (
          <p className="admin-empty">Nenhum programa cadastrado.</p>
        )}
        {grouped.map(
          (g) =>
            g.items.length > 0 && (
              <div key={g.idx} className="admin-day-group">
                <h3 className="admin-day-title">{g.label}</h3>
                {g.items.map((p) => (
                  <article
                    key={p.id}
                    className={`admin-list-item ${!p.is_active ? "inactive" : ""}`}
                  >
                    {p.flyer_url && (
                      <img src={p.flyer_url} alt="Flyer" className="admin-list-thumb" />
                    )}
                    <div className="admin-list-info">
                      <h4>
                        {p.presenter ? `${p.presenter} · ${p.program_name}` : p.program_name}
                      </h4>
                      <p>
                        {p.start_time.slice(0, 5)} — {p.end_time.slice(0, 5)}
                      </p>
                      <span className={`admin-tag ${p.is_active ? "tag-success" : "tag-muted"}`}>
                        {p.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="admin-list-actions">
                      <button onClick={() => toggle(p)} title={p.is_active ? "Desativar" : "Ativar"}>
                        <PowerIcon />
                      </button>
                      <button onClick={() => startEdit(p)} title="Editar">
                        <PencilIcon />
                      </button>
                      <button className="danger" onClick={() => remove(p.id)} title="Excluir">
                        <TrashIcon />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ),
        )}
      </div>
    </section>
  );
}
