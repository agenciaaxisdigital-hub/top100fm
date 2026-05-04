import { useCallback, useEffect, useState } from "react";
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "@/lib/admin-api";
import { ImageUploader } from "./ImageUploader";
import { GiftIcon, PencilIcon, PlusIcon, PowerIcon, TrashIcon } from "./icons";
import type { Promotion } from "./types";

const EMPTY = {
  title: "",
  description: "",
  image_url: "",
  link: "",
  popup_duration_seconds: 10,
  show_as_popup: true,
  display_order: 0,
};

export function PromotionsManager() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await getPromotions();
    setPromos(Array.isArray(data) ? (data as Promotion[]) : []);
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
    if (!form.title.trim()) {
      alert("Informe o título");
      return;
    }
    setSaving(true);
    try {
      if (editing) await updatePromotion({ data: { id: editing.id, ...form } });
      else await createPromotion({ data: form });
      reset();
      load();
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: Promotion) => {
    setForm({
      title: p.title,
      description: p.description || "",
      image_url: p.image_url || "",
      link: p.link || "",
      popup_duration_seconds: p.popup_duration_seconds,
      show_as_popup: p.show_as_popup,
      display_order: p.display_order,
    });
    setEditing(p);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta promoção?")) return;
    await deletePromotion({ data: { id } });
    load();
  };

  const toggle = async (p: Promotion) => {
    await updatePromotion({ data: { id: p.id, is_active: !p.is_active } });
    load();
  };

  const safePromos = Array.isArray(promos) ? promos : [];

  const setAsPopup = async (p: Promotion) => {
    // Marca esta como popup e desmarca todas as outras
    const others = safePromos.filter((x) => x.id !== p.id && x.show_as_popup);
    await Promise.all(
      others.map((o) => updatePromotion({ data: { id: o.id, show_as_popup: false } })),
    );
    await updatePromotion({ data: { id: p.id, show_as_popup: !p.show_as_popup } });
    load();
  };

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <GiftIcon /> <span>Promoções</span>
        </h1>
        <button
          className="admin-btn-primary"
          onClick={() => {
            reset();
            setShowForm(true);
          }}
        >
          <PlusIcon /> Nova promoção
        </button>
      </header>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? "Editar promoção" : "Nova promoção"}</h3>
          <div className="admin-field">
            <label>Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Concorra a ingressos!"
              maxLength={120}
            />
          </div>
          <div className="admin-field">
            <label>Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva a promoção e como participar..."
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="admin-field">
            <label>Link de destino (opcional)</label>
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="admin-field">
            <label>Imagem de capa</label>
            {form.image_url && <img src={form.image_url} alt="" className="admin-preview-img" />}
            <ImageUploader onUploaded={(url) => setForm({ ...form, image_url: url })} />
            <input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="ou cole uma URL de imagem"
            />
          </div>
          <div className="admin-field">
            <label>Duração do popup (s)</label>
            <input
              type="number"
              value={form.popup_duration_seconds}
              onChange={(e) =>
                setForm({ ...form, popup_duration_seconds: Number(e.target.value) })
              }
              min={3}
              max={120}
            />
          </div>
          <div className="admin-field admin-checkbox">
            <label>
              <input
                type="checkbox"
                checked={form.show_as_popup}
                onChange={(e) => setForm({ ...form, show_as_popup: e.target.checked })}
              />
              Exibir como popup ao abrir o site
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="admin-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar promoção"}
            </button>
            <button className="admin-btn-secondary" onClick={reset}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {safePromos.length === 0 && (
          <p className="admin-empty">Nenhuma promoção cadastrada ainda.</p>
        )}
        {safePromos.map((p) => (
          <article key={p.id} className={`admin-list-item ${!p.is_active ? "inactive" : ""}`}>
            {p.image_url && <img src={p.image_url} alt="" className="admin-list-thumb" />}
            <div className="admin-list-info">
              <h4>{p.title}</h4>
              <p>{p.description || "—"}</p>
              <div className="admin-list-tags">
                <span className={`admin-tag ${p.is_active ? "tag-success" : "tag-muted"}`}>
                  {p.is_active ? "Ativa" : "Inativa"}
                </span>
                {p.show_as_popup && <span className="admin-tag tag-success">⭐ Popup ativo</span>}
                <span className="admin-tag">{p.popup_duration_seconds}s</span>
              </div>
            </div>
            <div className="admin-list-actions">
              <button
                onClick={() => setAsPopup(p)}
                title={p.show_as_popup ? "Remover do popup" : "Definir como popup do site"}
                style={{ color: p.show_as_popup ? "#f59e0b" : undefined }}
              >
                {p.show_as_popup ? "★" : "☆"}
              </button>
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
    </section>
  );
}
