import { useState } from "react";
import { submitPromotionEntry } from "@/lib/public-api";
import { LgpdTermsModal } from "@/components/LgpdTermsModal";
import logo from "@/assets/top100-logo.png";

const RADIO_INSTAGRAM = "https://www.instagram.com/top100fmoficial";

const maskCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11)
  .replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) => v.replace(/\D/g, "").slice(0, 11)
  .replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8)
  .replace(/(\d{5})(\d)/, "$1-$2");

export function PromotionEntryForm({ promotionId, onClose, onSuccess }: { promotionId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ full_name: "", birth_date: "", whatsapp: "", cpf: "", instagram: "", facebook: "", cep: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [acceptedLgpd, setAcceptedLgpd] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (!form.birth_date) {
      setErr("Informe sua data de nascimento.");
      return;
    }
    if (!acceptedLgpd) {
      setErr("Você precisa aceitar o termo de tratamento de dados (LGPD) para continuar.");
      return;
    }

    setLoading(true);
    try {
      await submitPromotionEntry({ data: { promotion_id: promotionId, ...form } });
      setSuccess(true);
      setCountdown(3);
      let c = 3;
      const t = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(t);
          window.location.href = RADIO_INSTAGRAM;
        }
      }, 1000);
    } catch (e: any) {
      setErr(e?.message || "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .promo-form-card {
          max-width: 460px !important;
          padding: 0 !important;
          overflow: hidden !important;
          border-radius: 14px !important;
          box-shadow: 0 25px 60px -15px rgba(10,31,68,0.45) !important;
        }
        .promo-form-header {
          background: linear-gradient(135deg, #f5a623 0%, #f7b733 50%, #ffcb47 100%);
          padding: 28px 28px 24px;
          color: #0a1f44;
          text-align: center;
          position: relative;
        }
        .promo-form-header::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, #0a1f44 0%, #1e3a7a 50%, #0a1f44 100%);
        }
        .promo-form-logo {
          height: 78px;
          width: auto;
          margin: 0 auto 14px;
          display: block;
          filter: drop-shadow(0 3px 8px rgba(0,0,0,0.18));
        }
        .promo-form-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .promo-form-header p {
          margin: 4px 0 0;
          font-size: 12.5px;
          opacity: 0.85;
          font-weight: 400;
        }
        .promo-form-body {
          padding: 22px 28px 24px;
          background: #fff;
        }
        .promo-form-body .entry-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e2e6ee;
          border-radius: 8px;
          font-size: 14px;
          color: #1f2937;
          background: #fafbfc;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .promo-form-body .entry-input:focus {
          outline: none;
          border-color: #0a1f44;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(10,31,68,0.08);
        }
        .promo-form-body .entry-input::placeholder { color: #9ca3af; }
        .promo-form-lgpd {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 12px 14px;
          background: #f4f6fb;
          border-radius: 8px;
          margin-top: 6px;
          font-size: 12px;
          color: #4b5563;
          line-height: 1.5;
        }
        .promo-form-lgpd input[type="checkbox"] {
          margin-top: 2px;
          width: 15px;
          height: 15px;
          accent-color: #0a1f44;
          cursor: pointer;
          flex-shrink: 0;
        }
        .promo-form-lgpd .lgpd-link {
          background: none;
          border: none;
          padding: 0;
          color: #0a1f44;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          font-size: 12px;
        }
        .promo-form-submit {
          width: 100%;
          padding: 13px;
          margin-top: 4px;
          background: linear-gradient(135deg, #0a1f44 0%, #1e3a7a 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14.5px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(10,31,68,0.25);
        }
        .promo-form-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(10,31,68,0.35);
        }
        .promo-form-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          background: #6b7280;
          box-shadow: none;
        }
        .promo-form-error {
          padding: 10px 12px;
          background: #fef2f2;
          border-left: 3px solid #c0392b;
          color: #991b1b;
          font-size: 13px;
          border-radius: 4px;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .promo-form-card .popup-card {
          max-height: 95dvh;
          overflow-y: auto;
        }
        @media (max-height: 700px) {
          .promo-form-body { padding: 14px 20px 16px; }
          .promo-form-header { padding: 16px 20px 14px; }
          .promo-form-logo { height: 52px; margin-bottom: 8px; }
          .promo-form-body form { gap: 7px; }
        }
      `}</style>

      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-card promo-form-card" onClick={(e) => e.stopPropagation()}>
          <button className="popup-close" onClick={onClose} style={{ zIndex: 2 }}>✕</button>

          <div className="promo-form-header">
            <img src={logo} alt="Rádio TOP100 FM" className="promo-form-logo" />
            <h2>Participar da Promoção</h2>
            <p>Preencha seus dados e concorra a prêmios</p>
          </div>

          {success ? (
            <div className="promo-form-body" style={{ textAlign: "center", padding: "36px 28px" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <h3 style={{ color: "#0a1f44", fontWeight: 800, fontSize: 20, marginBottom: 10 }}>
                Inscrição realizada!
              </h3>
              <p style={{ color: "#374151", fontSize: 14, marginBottom: 6, lineHeight: 1.5 }}>
                Para <strong>finalizar sua inscrição</strong>, siga o Instagram oficial da rádio:
              </p>
              <p style={{ color: "#0a1f44", fontWeight: 700, fontSize: 15, marginBottom: 22 }}>
                @top100fmoficial
              </p>
              <a
                href={RADIO_INSTAGRAM}
                onClick={onSuccess}
                style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #0a1f44 0%, #1e3a7a 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  padding: "13px 28px",
                  borderRadius: 8,
                  textDecoration: "none",
                  letterSpacing: 0.4,
                  boxShadow: "0 4px 12px rgba(10,31,68,0.25)",
                }}
              >
                Seguir no Instagram →
              </a>
              <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 14 }}>
                Redirecionando em <strong style={{ color: "#0a1f44" }}>{countdown}s</strong>...
              </p>
            </div>
          ) : (
          <div className="promo-form-body">
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input required placeholder="Nome completo *" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="entry-input" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, paddingLeft: 2 }}>
                  Data de nascimento <span style={{ color: "#c8102e" }}>*</span>
                </label>
                <input
                  required
                  type="date"
                  value={form.birth_date}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  className="entry-input"
                />
              </div>
              <input required placeholder="WhatsApp * (com DDD)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })} className="entry-input" />
              <input required placeholder="CPF *" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} className="entry-input" />
              <input required placeholder="@usuário do Instagram *" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="entry-input" />
              <input required placeholder="CEP * (somente números)" value={form.cep} onChange={(e) => setForm({ ...form, cep: maskCep(e.target.value) })} className="entry-input" maxLength={9} />

              <label className="promo-form-lgpd">
                <input
                  type="checkbox"
                  checked={acceptedLgpd}
                  onChange={(e) => setAcceptedLgpd(e.target.checked)}
                  required
                />
                <span>
                  Li e aceito o tratamento dos meus dados pessoais conforme a LGPD.{" "}
                  <button type="button" onClick={() => setShowTerms(true)} className="lgpd-link">
                    ler termos
                  </button>
                </span>
              </label>

              {err && (
                <div className="promo-form-error" role="alert">
                  ⚠ {err}
                </div>
              )}

              <button type="submit" disabled={loading || !acceptedLgpd} className="promo-form-submit">
                {loading ? "Enviando..." : "Confirmar Inscrição"}
              </button>
            </form>
          </div>
          )}
        </div>
      </div>

      {showTerms && <LgpdTermsModal onClose={() => setShowTerms(false)} />}
    </>
  );
}
