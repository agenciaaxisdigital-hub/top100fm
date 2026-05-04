import { useCallback, useEffect, useState } from "react";
import {
  getNews,
  createNews,
  updateNews,
  deleteNews,
  getSiteSettings,
  updateSiteSettings,
  triggerAutoNewsManual,
} from "@/lib/admin-api";
import { ImageUploader } from "./ImageUploader";
import { NewsIcon, PencilIcon, PinIcon, PlusIcon, PowerIcon, TrashIcon } from "./icons";
import type { NewsItem } from "./types";

const EMPTY = {
  title: "",
  content: "",
  summary: "",
  image_url: "",
  podcast_link: "",
};

export function NewsManager() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoMsg, setAutoMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [data, settings] = await Promise.all([getNews(), getSiteSettings()]);
    setNews(Array.isArray(data) ? (data as NewsItem[]) : []);
    setAutoEnabled(settings?.auto_news_enabled === true || settings?.auto_news_enabled === "true");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAuto = async () => {
    const next = !autoEnabled;
    setAutoEnabled(next);
    await updateSiteSettings({ data: { key: "auto_news_enabled", value: String(next) } });
  };

  const runNow = async () => {
    setAutoBusy(true);
    setAutoMsg(null);
    try {
      const r = await triggerAutoNewsManual();
      setAutoMsg(`✓ ${r.inserted} novas, ${r.skipped} já existentes (de ${r.total} encontradas)`);
      load();
    } catch (e) {
      setAutoMsg(`Erro: ${e instanceof Error ? e.message : "falhou"}`);
    } finally {
      setAutoBusy(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("Informe o título");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updateNews({ data: { id: editing.id, ...form } });
      else await createNews({ data: form });
      reset();
      load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (n: NewsItem) => {
    setForm({
      title: n.title,
      content: n.content || "",
      summary: n.summary || "",
      image_url: n.image_url || "",
      podcast_link: n.podcast_link || "",
    });
    setEditing(n);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta notícia?")) return;
    await deleteNews({ data: { id } });
    load();
  };

  const togglePub = async (n: NewsItem) => {
    await updateNews({ data: { id: n.id, is_published: !n.is_published } });
    load();
  };

  const PIN_LIMIT = 3;
  const safeNews = Array.isArray(news) ? news : [];

  const togglePin = async (n: NewsItem) => {
    const isPinned = !!n.is_pinned;
    if (!isPinned) {
      const pinnedCount = safeNews.filter((x) => x.is_pinned).length;
      if (pinnedCount >= PIN_LIMIT) {
        alert(`Você já fixou ${PIN_LIMIT} notícias. Desafixe uma antes de fixar outra.`);
        return;
      }
    }
    await updateNews({
      data: {
        id: n.id,
        is_pinned: !isPinned,
        pinned_at: !isPinned ? new Date().toISOString() : null,
      },
    });
    load();
  };

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <NewsIcon /> <span>Notícias</span>
        </h1>
        <button
          className="admin-btn-primary"
          onClick={() => {
            reset();
            setShowForm(true);
          }}
        >
          <PlusIcon /> Nova notícia
        </button>
      </header>

      <div className="admin-form-card" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <strong>Auto-alimentação (Câmara, Senado, Gov.br, Agência Brasil)</strong>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.75 }}>
            Quando ligado, o cron busca e publica notícias dos portais oficiais automaticamente.
          </p>
          {autoMsg && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{autoMsg}</p>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={autoEnabled} onChange={toggleAuto} />
            <span>{autoEnabled ? "Ativada" : "Desativada"}</span>
          </label>
          <button className="admin-btn-secondary" onClick={runNow} disabled={autoBusy}>
            {autoBusy ? "Buscando..." : "Buscar agora"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? "Editar notícia" : "Nova notícia"}</h3>
          <div className="admin-field">
            <label>Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Título da notícia"
              maxLength={180}
            />
          </div>
          <div className="admin-field">
            <label>Resumo (aparece na listagem)</label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Resumo curto..."
              rows={2}
              maxLength={300}
            />
          </div>
          <div className="admin-field">
            <label>Conteúdo completo</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Texto completo..."
              rows={8}
            />
          </div>
          <div className="admin-field">
            <label>Imagem de capa</label>
            {form.image_url && <img src={form.image_url} alt="" className="admin-preview-img" />}
            <ImageUploader onUploaded={(url) => setForm({ ...form, image_url: url })} />
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="ou cole uma URL"
            />
          </div>
          <div className="admin-field">
            <label>Link de podcast (opcional)</label>
            <input
              value={form.podcast_link}
              onChange={(e) => setForm({ ...form, podcast_link: e.target.value })}
              placeholder="https://podcast..."
            />
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar notícia"}
            </button>
            <button className="admin-btn-secondary" onClick={reset}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {safeNews.length === 0 && <p className="admin-empty">Nenhuma notícia cadastrada.</p>}
        {safeNews.map((n) => (
          <article key={n.id} className={`admin-list-item ${!n.is_published ? "inactive" : ""}`}>
            {n.image_url && <img src={n.image_url} alt="" className="admin-list-thumb" />}
            <div className="admin-list-info">
              <h4>{n.title}</h4>
              <p>{n.summary || n.content?.slice(0, 140) || "—"}</p>
              {(n.is_pinned || !n.is_published || n.auto_generated) && (
                <div className="admin-list-tags">
                  {!n.is_published && <span className="admin-tag tag-muted">Rascunho</span>}
                  {n.is_pinned && <span className="admin-tag tag-warning">Fixada</span>}
                  {n.auto_generated && (
                    <span className="admin-tag tag-muted">Auto · {n.source_name || "RSS"}</span>
                  )}
                </div>
              )}
            </div>
            <div className="admin-list-actions">
              <button onClick={() => togglePub(n)} title={n.is_published ? "Despublicar" : "Publicar"}>
                <PowerIcon />
              </button>
              <button
                onClick={() => togglePin(n)}
                title={n.is_pinned ? "Desafixar" : "Fixar (máx. 3)"}
                className={n.is_pinned ? "active" : ""}
              >
                <PinIcon />
              </button>
              <button onClick={() => startEdit(n)} title="Editar">
                <PencilIcon />
              </button>
              <button className="danger" onClick={() => remove(n.id)} title="Excluir">
                <TrashIcon />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
