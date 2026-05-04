import { useEffect, useState } from "react";
import { useSiteSettings } from "@/lib/site-settings-context";
export function SiteSettingsPage() {
  const { settings, isLoading, update } = useSiteSettings();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    for (const [k, v] of Object.entries(form)) {
      await update(k, v);
    }
    alert("⚡️ Configurações salvas!");
  };

  if (isLoading) return <p className="admin-hint">Carregando…</p>;

  return (
    <section className="admin-section">
      <div className="admin-header">
        <h2>Configurações do Site</h2>
      </div>
      <div className="admin-form-card">
      {/* Identidade visual */}
      <h3>Identidade Visual</h3>
      <div className="admin-grid">
        <label>
          Nome da rádio
          <input
            type="text"
            value={form.radio_name ?? ""}
            onChange={(e) => handleChange("radio_name", e.target.value)}
          />
        </label>
        <label>
          Slogan
          <input
            type="text"
            value={form.radio_slogan ?? ""}
            onChange={(e) => handleChange("radio_slogan", e.target.value)}
          />
        </label>
        <label>
          Descrição (SEO)
          <textarea
            rows={3}
            value={form.radio_description ?? ""}
            onChange={(e) => handleChange("radio_description", e.target.value)}
          />
        </label>
        <label>
          Logo (URL)
          <input
            type="url"
            value={form.logo_url ?? ""}
            onChange={(e) => handleChange("logo_url", e.target.value)}
          />
        </label>
        <label>
          Favicon (URL)
          <input
            type="url"
            value={form.favicon_url ?? ""}
            onChange={(e) => handleChange("favicon_url", e.target.value)}
          />
        </label>
        <label>
          Cor primária
          <input
            type="color"
            value={form.color_primary ?? "#ff6600"}
            onChange={(e) => handleChange("color_primary", e.target.value)}
          />
        </label>
        <label>
          Cor secundária
          <input
            type="color"
            value={form.color_secondary ?? "#0066ff"}
            onChange={(e) => handleChange("color_secondary", e.target.value)}
          />
        </label>
      </div>

      {/* URLs dinâmicas */}
      <h3>URLs Dinâmicas</h3>
      <div className="admin-grid">
        <label>
          URL do stream de áudio
          <input
            type="url"
            value={form.stream_url ?? ""}
            onChange={(e) => handleChange("stream_url", e.target.value)}
          />
        </label>
        <label>
          URL do iframe da home
          <input
            type="url"
            value={form.home_iframe_url ?? ""}
            onChange={(e) => handleChange("home_iframe_url", e.target.value)}
          />
        </label>
        <label>
          Texto “Tocando agora”
          <input
            type="text"
            value={form.now_playing_text ?? ""}
            onChange={(e) => handleChange("now_playing_text", e.target.value)}
          />
        </label>
      </div>

      {/* Header & Footer */}
      <h3>Header & Footer</h3>
      <div className="admin-grid">
        <label>
          Itens do menu (JSON)
          <textarea
            rows={4}
            value={JSON.stringify(form.menu_items ?? [], null, 2)}
            onChange={(e) => {
              try {
                handleChange("menu_items", JSON.parse(e.target.value));
              } catch {}
            }}
          />
        </label>
        <label>
          Redes sociais (JSON)
          <textarea
            rows={4}
            value={JSON.stringify(form.social_links ?? [], null, 2)}
            onChange={(e) => {
              try {
                handleChange("social_links", JSON.parse(e.target.value));
              } catch {}
            }}
          />
        </label>
        <label>
          Telefone
          <input
            type="text"
            value={form.contact_phone ?? ""}
            onChange={(e) => handleChange("contact_phone", e.target.value)}
          />
        </label>
        <label>
          E‑mail
          <input
            type="email"
            value={form.contact_email ?? ""}
            onChange={(e) => handleChange("contact_email", e.target.value)}
          />
        </label>
        <label>
          Endereço
          <input
            type="text"
            value={form.contact_address ?? ""}
            onChange={(e) => handleChange("contact_address", e.target.value)}
          />
        </label>
      </div>

      {/* Transmissão ao vivo */}
      <h3>Transmissão Ao Vivo (YouTube)</h3>
      <div className="admin-grid">
        <label>
          Estamos ao vivo agora?
          <input
            type="checkbox"
            checked={!!form.live_active}
            onChange={(e) => handleChange("live_active", e.target.checked)}
          />
        </label>
        <label>
          Link do YouTube (vídeo ou live)
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={form.live_youtube_url ?? ""}
            onChange={(e) => handleChange("live_youtube_url", e.target.value)}
          />
        </label>
        <label>
          Título da transmissão
          <input
            type="text"
            placeholder="Ex.: Manhã TOP — Ao vivo"
            value={form.live_title ?? ""}
            onChange={(e) => handleChange("live_title", e.target.value)}
          />
        </label>
      </div>

      {/* Notícias Automáticas */}
      <h3>Notícias Automáticas</h3>
      <div className="admin-grid">
        <label>
          Habilitar alimentação automática (5 notícias/dia via RSS)
          <input
            type="checkbox"
            checked={!!form.auto_news_enabled}
            onChange={(e) => handleChange("auto_news_enabled", e.target.checked)}
          />
        </label>
      </div>
      <p className="admin-hint" style={{ marginBottom: 16 }}>
        Quando ativado, o sistema insere até <b>5 notícias por dia</b> automaticamente
        a partir de fontes como Agência Brasil, Gov.br e Senado Federal.
        As notícias aparecem publicadas imediatamente no site.
      </p>

      {/* Popup de promoção */}
      <h3>Popup de Promoção</h3>
      <div className="admin-grid">
        <label>
          Habilitar popup global
          <input
            type="checkbox"
            checked={!!form.popup_enabled}
            onChange={(e) => handleChange("popup_enabled", e.target.checked)}
          />
        </label>
        <label>
          Frequência
          <select
            value={form.popup_frequency ?? "always"}
            onChange={(e) => handleChange("popup_frequency", e.target.value)}
          >
            <option value="always">Sempre</option>
            <option value="once_per_session">1 x por sessão</option>
            <option value="once_per_day">1 x por dia</option>
            <option value="once_per_week">1 x por semana</option>
          </select>
        </label>
        <label>
          Delay (segundos)
          <input
            type="number"
            min={0}
            value={form.popup_delay ?? 0}
            onChange={(e) => handleChange("popup_delay", Number(e.target.value))}
          />
        </label>
        <label>
          Posição
          <select
            value={form.popup_position ?? "center"}
            onChange={(e) => handleChange("popup_position", e.target.value)}
          >
            <option value="center">Centro</option>
            <option value="bottom_right">Canto inferior direito</option>
          </select>
        </label>
      </div>

      {/* Botões de ação */}
      <div className="admin-form-actions mt-6">
        <button className="admin-btn-primary" onClick={handleSave}>
          Salvar tudo
        </button>
        <button className="admin-btn-secondary" onClick={() => setForm(settings)}>
          Resetar
        </button>
      </div>
      </div>
    </section>
  );
}
