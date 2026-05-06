import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useState, useEffect } from "react";
import { getActivePromotions } from "@/lib/public-api";
import { PromotionEntryForm } from "@/components/PromotionEntryForm";

export const Route = createFileRoute("/promocoes")({
  head: () => ({
    meta: [
      { title: "Promoções | TOP100 FM" },
      { name: "description", content: "Concorra a prêmios incríveis da Rádio TOP100 FM! Cadastre-se nas promoções ativas e boa sorte." },
      { property: "og:title", content: "Promoções | TOP100 FM" },
    ],
  }),
  component: PromocoesPage,
});

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  is_active: boolean;
  popup_duration_seconds: number;
};

function PromocoesPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [participating, setParticipating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getActivePromotions().then((data) => setPromos(data as Promotion[]));
  }, []);

  const open = (p: Promotion) => { setSelected(p); setParticipating(false); setSuccess(false); };
  const close = () => { setSelected(null); setParticipating(false); setSuccess(false); };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a1f44] text-white">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#c8102e]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full bg-[#ffd84d]/10 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ffd84d] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ffd84d]" />
            </span>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-white/90">
              Concorra agora
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
            Promoções{" "}
            <span className="bg-gradient-to-r from-[#ffd84d] to-[#ff9a3c] bg-clip-text text-transparent">
              TOP100 FM
            </span>
          </h1>
          <p className="mt-4 text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
            Participe das nossas promoções, faça seu cadastro e concorra a prêmios incríveis. É rápido e gratuito!
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs">
            <span className="text-white/50">Promoções ativas</span>
            <span className="font-bold text-[#ffd84d]">{promos.length}</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {promos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 md:p-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a] text-2xl">
              🎁
            </div>
            <p className="text-base md:text-lg font-bold text-[#0a1f44]">Nenhuma promoção ativa no momento</p>
            <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
              Fique ligado! Novas promoções são lançadas frequentemente.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0a1f44] hover:border-[#c8102e]/40 hover:text-[#c8102e] transition-all"
            >
              ← Voltar para a home
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p, i) => (
              <article
                key={p.id}
                className="group relative rounded-2xl bg-white border border-gray-200/80 overflow-hidden hover:border-[#0a1f44]/25 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                onClick={() => open(p)}
              >
                {/* Badge de número */}
                <div className="absolute top-3 left-3 z-10 h-7 w-7 rounded-full bg-[#0a1f44]/80 backdrop-blur flex items-center justify-center text-[10px] font-black text-white">
                  {i + 1}
                </div>

                {/* Imagem */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a]">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🎁</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#c8102e] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow">
                    Ativa
                  </div>
                </div>

                {/* Corpo */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-black text-[#0a1f44] text-base md:text-lg leading-tight mb-2 group-hover:text-[#c8102e] transition-colors">
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#c8102e] to-[#a00d24] py-2.5 text-sm font-black text-white hover:from-[#a00d24] hover:to-[#800a1c] hover:-translate-y-0.5 transition-all shadow-md"
                      onClick={(e) => { e.stopPropagation(); open(p); }}
                    >
                      🎁 Participar agora
                    </button>
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#0a1f44] hover:text-[#0a1f44] transition"
                        title="Saiba mais"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0a1f44] hover:border-[#c8102e]/40 hover:text-[#c8102e] hover:-translate-y-0.5 transition-all shadow-sm"
          >
            ← Voltar para a home
          </Link>
        </div>
      </main>

      <SiteFooter />

      {/* MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(5,15,35,0.75)", backdropFilter: "blur(6px)" }}
          onClick={close}
        >
          <div
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center transition"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {!participating && !success && (
              <>
                <div className="relative h-44 sm:h-56 bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a] shrink-0">
                  {selected.image_url ? (
                    <img src={selected.image_url} alt={selected.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🎁</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f44]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#c8102e] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow">
                    🎁 Promoção ativa
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0a1f44] leading-tight mb-2">{selected.title}</h2>
                  {selected.description && (
                    <p className="text-sm text-gray-500 leading-relaxed">{selected.description}</p>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0">
                  <button
                    onClick={() => setParticipating(true)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#c8102e] to-[#a00d24] py-3 text-sm font-black text-white hover:from-[#a00d24] transition shadow-md"
                  >
                    🎁 Participar agora →
                  </button>
                  {selected.link && (
                    <a
                      href={selected.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-12 px-4 rounded-xl border border-gray-200 flex items-center text-sm font-bold text-gray-500 hover:border-[#0a1f44] hover:text-[#0a1f44] transition"
                    >
                      Saiba mais
                    </a>
                  )}
                </div>
              </>
            )}

            {participating && (
              <div className="flex-1 overflow-y-auto min-h-0">
                <PromotionEntryForm
                  promotionId={selected.id}
                  onClose={() => setParticipating(false)}
                  onSuccess={() => { setParticipating(false); setSuccess(true); }}
                />
              </div>
            )}

            {success && (
              <div className="flex flex-col items-center justify-center p-10 text-center gap-4 flex-1 min-h-[320px]">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-4xl">🎉</div>
                <h3 className="text-2xl font-black text-[#0a1f44]">Inscrição confirmada!</h3>
                <p className="text-gray-500 text-sm max-w-xs">Você está na disputa. Boa sorte! Fique ligado na TOP100 FM para saber o resultado.</p>
                <button
                  onClick={close}
                  className="mt-2 rounded-xl bg-[#0a1f44] px-8 py-3 text-sm font-bold text-white hover:bg-[#1a3a7a] transition"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
