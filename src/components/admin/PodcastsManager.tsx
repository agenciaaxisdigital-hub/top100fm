import { useCallback, useEffect, useState } from "react";
import {
  getPodcastsAdmin,
  createPodcast,
  updatePodcast,
  deletePodcast,
  getLiveStreamAdmin,
  setLiveStream,
} from "@/lib/admin-api";
import { ImageUploader } from "./ImageUploader";
import { MicIcon, PencilIcon, PlusIcon, PowerIcon, TrashIcon } from "./icons";
import type { PodcastItemAdmin } from "./types";

const EMPTY = {
  title: "",
  description: "",
  youtube_url: "",
  thumbnail_url: "",
  display_order: 0,
};

function getYtId(url: string): string | null {
  if (!url) return null;
  // Suporta watch?v=, youtu.be/, embed/, shorts/, live/ e v/
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

export function PodcastsManager() {
  const [items, setItems] = useState<PodcastItemAdmin[]>([]);
  const [editing, setEditing] = useState<PodcastItemAdmin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [live, setLive] = useState({ active: false, url: "", title: "" });
  const [liveSaving, setLiveSaving] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const data = await getPodcastsAdmin();
      setItems(Array.isArray(data) ? (data as PodcastItemAdmin[]) : []);
    } catch (e: any) {
      setLoadErr(e?.message || "Erro ao carregar podcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLive = useCallback(async () => {
    const data = await getLiveStreamAdmin();
    if (data) setLive({ active: data.active, url: data.url || "", title: data.title || "" });
  }, []);

  useEffect(() => {
    load();
    loadLive();
  }, [load, loadLive]);

  const saveLive = async () => {
    if (live.active && !live.url.trim()) {
      alert("Informe a URL da transmissão ao vivo");
      return;
    }
    setLiveSaving(true);
    try {
      await setLiveStream({ data: { active: live.active, url: live.url, title: live.title } });
      alert(live.active ? "Transmissão ao vivo ativada!" : "Transmissão ao vivo desativada.");
    } finally {
      setLiveSaving(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.title.trim() || !form.youtube_url.trim()) {
      alert("Título e link do YouTube são obrigatórios");
      return;
    }
    if (!getYtId(form.youtube_url)) {
      alert("Link do YouTube inválido. Use youtube.com/watch?v=… ou youtu.be/…");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updatePodcast({ data: { id: editing.id, ...form } });
      else await createPodcast({ data: form });
      reset();
      load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: PodcastItemAdmin) => {
    setForm({
      title: p.title,
      description: p.description || "",
      youtube_url: p.youtube_url,
      thumbnail_url: p.thumbnail_url || "",
      display_order: p.display_order ?? 0,
    });
    setEditing(p);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este podcast?")) return;
    await deletePodcast({ data: { id } });
    load();
  };

  const toggle = async (p: PodcastItemAdmin) => {
    await updatePodcast({ data: { id: p.id, is_active: !p.is_active } });
    load();
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <MicIcon /> <span>Podcasts</span>
        </h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="admin-btn-secondary" onClick={load} disabled={loading} title="Atualizar lista">
            {loading ? "⟳" : "↻"} Atualizar
          </button>
          <button className="admin-btn-primary" onClick={() => { reset(); setShowForm(true); }}>
            <PlusIcon /> Novo podcast
          </button>
        </div>
      </header>

      <div className="admin-form-card">
        <h3>🔴 Transmissão ao vivo</h3>
        <div className="admin-field">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={live.active}
              onChange={(e) => setLive({ ...live, active: e.target.checked })}
              style={{ width: "1.1rem", height: "1.1rem" }}
            />
            <span>{live.active ? "AO VIVO ativado" : "AO VIVO desativado"}</span>
          </label>
        </div>
        <div className="admin-field">
          <label>URL da transmissão (YouTube Live, etc.)</label>
          <input
            value={live.url}
            onChange={(e) => setLive({ ...live, url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <small className="admin-hint">
            Cole o link do YouTube Live ou qualquer URL de stream.
          </small>
        </div>
        <div className="admin-field">
          <label>Título da transmissão (opcional)</label>
          <input
            value={live.title}
            onChange={(e) => setLive({ ...live, title: e.target.value })}
            placeholder="Ex: Top 100 FM ao vivo agora!"
            maxLength={120}
          />
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn-primary" onClick={saveLive} disabled={liveSaving}>
            {liveSaving ? "Salvando..." : "Salvar transmissão"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? "Editar podcast" : "Novo podcast"}</h3>
          <div className="admin-field">
            <label>Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Episódio 01 — Bastidores"
              maxLength={140}
            />
          </div>
          <div className="admin-field">
            <label>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Sobre o que é o episódio..."
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="admin-field">
            <label>Link do YouTube *</label>
            <input
              value={form.youtube_url}
              onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <small className="admin-hint">
              Aceita youtube.com/watch, youtu.be e youtube.com/shorts
            </small>
          </div>
          <div className="admin-field">
            <label>Capa personalizada (opcional)</label>
            {form.thumbnail_url && (
              <img src={form.thumbnail_url} alt="" className="admin-preview-img" />
            )}
            <ImageUploader onUploaded={(url) => setForm({ ...form, thumbnail_url: url })} />
            <input
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="ou cole uma URL"
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
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar podcast"}
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
        {!loadErr && safeItems.length === 0 && <p className="admin-empty">Nenhum podcast cadastrado.</p>}
        {safeItems.map((p) => {
          const ytId = getYtId(p.youtube_url);
          const thumb =
            p.thumbnail_url || (ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : "");
          return (
            <article
              key={p.id}
              className={`admin-list-item ${!p.is_active ? "inactive" : ""}`}
            >
              {thumb && <img src={thumb} alt="" className="admin-list-thumb" />}
              <div className="admin-list-info">
                <h4>{p.title}</h4>
                <p>{p.description || "—"}</p>
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
          );
        })}
      </div>
    </section>
  );
}
