import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings } from "@/lib/admin-api";
import { ImageUploader } from "./ImageUploader";
import { PencilIcon, PlusIcon, TrashIcon } from "./icons";


export type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  link?: string;
  display_order?: number;
  is_active?: boolean;
};

const EMPTY: Omit<Sponsor, "id"> = {
  name: "",
  logo_url: "",
  link: "",
  display_order: 0,
  is_active: true,
};

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function SponsorsManager() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const settings = await getSiteSettings();
      const list = Array.isArray(settings?.sponsors) ? (settings.sponsors as Sponsor[]) : [];
      list.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setItems(list);
    } catch (e: any) {
      setLoadError(e?.message || "Erro ao carregar patrocinadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const persist = async (next: Sponsor[]) => {
    const safeNext = Array.isArray(next) ? next : [];
    await updateSiteSettings({ data: { key: "sponsors", value: safeNext } });
    setItems(safeNext);
  };

  const reset = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.name.trim()) {
      alert("Informe o nome do patrocinador");
      return;
    }
    if (!form.logo_url.trim()) {
      alert("Faça upload da logo do patrocinador");
      return;
    }
    setSaving(true);
    try {
      const next = editing
        ? items.map((s) => (s.id === editing.id ? { ...editing, ...form } : s))
        : [...items, { id: uid(), ...form }];
      next.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      await persist(next);
      reset();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: Sponsor) => {
    setEditing(s);
    setForm({
      name: s.name,
      logo_url: s.logo_url,
      link: s.link || "",
      display_order: s.display_order ?? 0,
      is_active: s.is_active ?? true,
    });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este patrocinador?")) return;
    await persist(items.filter((s) => s.id !== id));
  };

  const toggle = async (s: Sponsor) => {
    await persist(items.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🤝</span> Patrocinadores
          </span>
        </h1>
        <button
          className="admin-btn-primary"
          onClick={() => {
            reset();
            setShowForm(true);
          }}
        >
          <PlusIcon /> Novo patrocinador
        </button>
      </header>

      <p className="admin-hint" style={{ marginBottom: 16 }}>
        Logo + nome aparecem juntos na home, na seção <b>Nossos Patrocinadores</b>. A ordem de
        exibição usa o campo <b>Ordem</b> (menor primeiro).
      </p>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? "Editar patrocinador" : "Novo patrocinador"}</h3>

          <div className="admin-field">
            <label>Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Supermercado Bom Preço"
              maxLength={80}
            />
          </div>

          <div className="admin-field">
            <label>Logo *</label>
            {form.logo_url && (
              <img src={form.logo_url} alt="" className="admin-preview-img" />
            )}
            <ImageUploader onUploaded={(url) => setForm({ ...form, logo_url: url })} />
            <input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="ou cole uma URL"
            />
          </div>

          <div className="admin-field">
            <label>Link do site (opcional)</label>
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="admin-field">
            <label>Ordem de exibição</label>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            />
          </div>

          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar patrocinador"}
            </button>
            <button className="admin-btn-secondary" onClick={reset}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {loading ? (
          <p className="admin-empty">Carregando...</p>
        ) : loadError ? (
          <p className="admin-empty" style={{ color: "#c0392b" }}>⚠ {loadError}</p>
        ) : safeItems.length === 0 ? (
          <p className="admin-empty">Nenhum patrocinador cadastrado.</p>
        ) : (
          safeItems.map((s) => (
            <article
              key={s.id}
              className={`admin-list-item ${!s.is_active ? "inactive" : ""}`}
            >
              {s.logo_url && (
                <img
                  src={s.logo_url}
                  alt={s.name}
                  className="admin-list-thumb"
                  style={{ objectFit: "contain", background: "#fff", padding: 6 }}
                />
              )}
              <div className="admin-list-info">
                <h4>{s.name}</h4>
                <p>
                  {s.link ? s.link : "—"}{" "}
                  <span style={{ opacity: 0.6 }}>· ordem {s.display_order ?? 0}</span>
                </p>
                <span className={`admin-tag ${s.is_active ? "tag-success" : "tag-muted"}`}>
                  {s.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="admin-list-actions">
                <button onClick={() => toggle(s)} title={s.is_active ? "Desativar" : "Ativar"}>
                  {s.is_active ? "🟢" : "⚪"}
                </button>
                <button onClick={() => startEdit(s)} title="Editar">
                  <PencilIcon />
                </button>
                <button className="danger" onClick={() => remove(s.id)} title="Excluir">
                  <TrashIcon />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
