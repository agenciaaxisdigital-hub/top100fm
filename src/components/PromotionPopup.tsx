import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribePublicTables } from "@/lib/supabase-public-refresh";
import { getActivePromotions } from "@/lib/public-api";
import { PromotionEntryForm } from "@/components/PromotionEntryForm";
import logo from "@/assets/top100-logo.png";

const RADIO_INSTAGRAM = "https://www.instagram.com/top100fmoficial";

// In-memory flag — resets on page reload, persists during SPA navigation
let _dismissed = false;

type Promotion = {
  id: string; title: string; description: string | null; image_url: string | null;
  link: string | null; popup_duration_seconds: number; show_as_popup: boolean;
};

type View = "promo" | "form" | "success";

export function PromotionPopup() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>("promo");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (_dismissed) return;
    getActivePromotions().then((data) => {
      const popups = (data as Promotion[]).filter((p) => p.show_as_popup);
      if (popups.length > 0) {
        setPromo(popups[0]);
        setTimeout(() => setVisible(true), 2000);
      }
    });
  }, []);

  useEffect(() => {
    return subscribePublicTables(supabase, ["promotions"], () => {
      if (_dismissed) return;
      void getActivePromotions().then((data) => {
        const popups = (data as Promotion[]).filter((p) => p.show_as_popup);
        setPromo(popups.length > 0 ? popups[0] : null);
      });
    });
  }, []);

  // Auto-fechar o popup inicial (apenas enquanto na view "promo")
  useEffect(() => {
    if (!promo || !visible || view !== "promo") return;
    const t = setTimeout(() => handleClose(), promo.popup_duration_seconds * 1000);
    return () => clearTimeout(t);
  }, [promo, visible, view]);

  // Countdown após sucesso
  useEffect(() => {
    if (view !== "success") return;
    let c = 3;
    setCountdown(3);
    const tick = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(tick);
        window.location.href = RADIO_INSTAGRAM;
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [view]);

  const handleClose = () => {
    _dismissed = true;
    setVisible(false);
  };

  if (!promo || !visible) return null;

  // ── VIEW: FORMULÁRIO ──────────────────────────────────────────────
  if (view === "form") {
    return (
      <PromotionEntryForm
        promotionId={promo.id}
        onClose={() => setView("promo")}
        onSuccess={() => setView("success")}
      />
    );
  }

  // ── VIEW: SUCESSO ─────────────────────────────────────────────────
  if (view === "success") {
    return (
      <div className="popup-overlay">
        <div className="popup-card" style={{ maxWidth: 420, textAlign: "center", padding: 0, overflow: "hidden", borderRadius: 14, boxShadow: "0 25px 60px -15px rgba(10,31,68,.45)" }}>
          <div style={{ background: "linear-gradient(135deg,#f5a623,#ffcb47)", padding: "28px 28px 22px" }}>
            <img src={logo} alt="TOP100 FM" style={{ height: 72, display: "block", margin: "0 auto 12px", filter: "drop-shadow(0 3px 8px rgba(0,0,0,.18))" }} />
          </div>
          <div style={{ padding: "32px 28px 36px", background: "#fff" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
            <h3 style={{ color: "#0a1f44", fontWeight: 800, fontSize: 20, margin: "0 0 10px" }}>
              Inscrição realizada!
            </h3>
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.55, margin: "0 0 6px" }}>
              Para <strong>finalizar sua inscrição</strong>, siga o Instagram oficial da rádio:
            </p>
            <p style={{ color: "#0a1f44", fontWeight: 700, fontSize: 15, margin: "0 0 24px" }}>
              @top100fmoficial
            </p>
            <a
              href={RADIO_INSTAGRAM}
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg,#0a1f44,#1e3a7a)",
                color: "#fff", fontWeight: 700, fontSize: 14,
                padding: "13px 32px", borderRadius: 8,
                textDecoration: "none", letterSpacing: .4,
                boxShadow: "0 4px 12px rgba(10,31,68,.25)",
              }}
            >
              Seguir no Instagram →
            </a>
            <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 16 }}>
              Redirecionando em <strong style={{ color: "#0a1f44" }}>{countdown}s</strong>...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: PROMO (padrão) ──────────────────────────────────────────
  return (
    <div className="popup-overlay" onClick={handleClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={handleClose} aria-label="Fechar">✕</button>
        {promo.image_url && (
          <div className="popup-img-wrap">
            <img src={promo.image_url} alt={promo.title} className="popup-img" />
            <span className="popup-badge">🎁 Promoção Top 100 FM</span>
          </div>
        )}
        <div className="popup-body">
          {!promo.image_url && <span className="popup-badge popup-badge-inline">🎁 Promoção Top 100 FM</span>}
          <h2>{promo.title}</h2>
          {promo.description && <p>{promo.description}</p>}
        </div>
        <div className="popup-footer">
          <button onClick={() => setView("form")} className="popup-btn-primary">
            Participar agora <span className="popup-btn-arrow">→</span>
          </button>
          {promo.link && (
            <a href={promo.link} target="_blank" rel="noopener noreferrer" className="popup-btn-secondary">
              Saiba mais
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
