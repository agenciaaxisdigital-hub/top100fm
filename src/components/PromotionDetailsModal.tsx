import { useState, useEffect } from "react";
import { PromotionEntryForm } from "@/components/PromotionEntryForm";

export type PromotionLike = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link?: string | null;
};

const INSTAGRAM_URL = "https://www.instagram.com/top100fmoficial";

export function PromotionDetailsModal({
  promo,
  onClose,
}: {
  promo: PromotionLike;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (step !== "success") return;
    if (countdown <= 0) {
      window.location.href = INSTAGRAM_URL;
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  if (step === "form") {
    return (
      <PromotionEntryForm
        promotionId={promo.id}
        onClose={() => setStep("details")}
        onSuccess={() => setStep("success")}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(8,10,18,0.78)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 30px 80px -10px rgba(200,16,46,0.5)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-white/95 text-[#0c2651] font-black text-lg shadow-lg hover:bg-[#c8102e] hover:text-white transition"
          aria-label="Fechar"
        >
          ✕
        </button>

        {/* Header chamativo */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#c8102e] via-[#a00d24] to-[#0c2651]">
          {promo.image_url ? (
            <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-7xl drop-shadow-xl animate-bounce">🎉</span>
              </div>
            </>
          )}
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#c8102e] shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8102e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c8102e]" />
            </span>
            Promoção no ar
          </div>
        </div>

        <div className="p-6">
          {step === "success" ? (
            <div className="text-center py-4">
              <div className="text-6xl mb-3 animate-bounce">🎊</div>
              <h2 className="text-2xl font-black text-[#0c2651] mb-2">Cadastro feito com sucesso!</h2>
              <p className="text-muted-foreground mb-5">
                Agora siga o Instagram oficial <strong>@top100fmoficial</strong> para concorrer e
                acompanhar o sorteio.
              </p>
              <a
                href={INSTAGRAM_URL}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#c8102e] to-[#ff5470] px-6 py-3 text-white font-black shadow-lg hover:-translate-y-0.5 transition"
              >
                📸 Seguir no Instagram
              </a>
              <p className="mt-3 text-xs text-muted-foreground">
                Redirecionando em {countdown}s…
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-black text-[#0c2651] leading-tight">
                {promo.title}
              </h2>
              {promo.description && (
                <p className="mt-3 text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
                  {promo.description}
                </p>
              )}
              <div className="mt-4 rounded-xl bg-[#fff8f0] border border-[#c8102e]/20 p-3 text-xs text-[#0c2651]">
                <strong className="text-[#c8102e]">📋 Regras:</strong> Preencha o formulário com
                seus dados verdadeiros. Siga o{" "}
                <a href="https://www.instagram.com/top100fmoficial" target="_blank" rel="noopener noreferrer" className="font-bold underline text-[#c8102e]">@top100fmoficial</a>{" "}
                no Instagram. O sorteio será divulgado no Instagram da rádio. Apenas uma inscrição por CPF.
              </div>
              <button
                onClick={() => setStep("form")}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-[#c8102e] to-[#ff5470] px-6 py-3.5 text-white font-black uppercase tracking-wide shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition text-base"
              >
                🎁 Quero participar agora
              </button>
              {promo.link && (
                <a
                  href={promo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-center text-sm font-bold text-[#0c2651] hover:text-[#c8102e] transition"
                >
                  Saiba mais →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
