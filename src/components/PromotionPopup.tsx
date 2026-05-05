import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribePublicTables } from "@/lib/supabase-public-refresh";
import { getActivePromotions } from "@/lib/public-api";
import { PromotionEntryForm } from "@/components/PromotionEntryForm";

type Promotion = {
  id: string; title: string; description: string | null; image_url: string | null;
  link: string | null; popup_duration_seconds: number; show_as_popup: boolean;
};

export function PromotionPopup() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [participating, setParticipating] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("promo_dismissed");
    if (dismissed) return;
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
      if (sessionStorage.getItem("promo_dismissed")) return;
      void getActivePromotions().then((data) => {
        const popups = (data as Promotion[]).filter((p) => p.show_as_popup);
        setPromo(popups.length > 0 ? popups[0] : null);
      });
    });
  }, []);

  useEffect(() => {
    if (promo && visible && !participating) {
      const timer = setTimeout(() => handleClose(), promo.popup_duration_seconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [promo, visible, participating]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem("promo_dismissed", "true");
  };

  if (!promo || !visible) return null;

  if (participating) {
    return (
      <PromotionEntryForm
        promotionId={promo.id}
        onClose={() => setParticipating(false)}
        onSuccess={handleClose}
      />
    );
  }

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
          <button onClick={() => setParticipating(true)} className="popup-btn-primary">
            Participar agora
            <span className="popup-btn-arrow">→</span>
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
