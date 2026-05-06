import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribePublicTables } from "@/lib/supabase-public-refresh";
import { safeImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias | TOP100 FM" },
      { name: "description", content: "Todas as notícias da Rádio TOP100 FM em um só lugar." },
      { property: "og:title", content: "Notícias | TOP100 FM" },
      { property: "og:description", content: "Todas as notícias da Rádio TOP100 FM." },
    ],
  }),
  component: NoticiasPage,
});

type NewsItem = {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  image_url: string | null;
  podcast_link: string | null;
  is_pinned?: boolean | null;
  pinned_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<NewsItem | null>(null);

  // ESC fecha + trava scroll do body quando modal aberto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNews = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("news")
        .select("*")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("pinned_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false });
      setNews((data as unknown as NewsItem[]) || []);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      reloadTimer.current = null;
      void loadNews({ silent: true });
    }, 450);
  }, [loadNews]);

  useEffect(() => {
    void loadNews({ silent: false });
  }, [loadNews]);

  useEffect(() => {
    return subscribePublicTables(supabase, ["news"], scheduleReload);
  }, [scheduleReload]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") scheduleReload();
    };
    const onFocus = () => scheduleReload();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [scheduleReload]);

  const fmtDate = (d: string | null) =>
    new Date(d || Date.now()).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const cleanText = (s: string | null | undefined) =>
    s ? s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a1f44] text-white">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[#c8102e]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full bg-[#1a3a7a]/50 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Sempre atualizado</span>
          </div>
          <h1 className="font-display text-7xl sm:text-8xl md:text-[110px] text-white">
            Notícias
          </h1>
          <p className="mt-3 text-white/60 max-w-lg text-sm md:text-base">
            Tudo que acontece em Aparecida de Goiânia e no Brasil, na voz da TOP100 FM.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs">
            <span className="text-white/50">Publicadas</span>
            <span className="font-bold text-white">{news.length}</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="text-lg text-muted-foreground">Nenhuma notícia publicada ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cadastre notícias no painel administrativo.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <article
                key={n.id}
                onClick={() => setOpen(n)}
                className="group cursor-pointer rounded-2xl bg-white overflow-hidden transition-all duration-300 card-shadow hover:-translate-y-1"
              >
                {n.image_url ? (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={safeImageUrl(n.image_url)}
                      alt={n.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a] flex items-center justify-center">
                    <span className="text-white/30 text-5xl">📻</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[#c8102e] mb-2">
                    {fmtDate(n.updated_at || n.created_at)}
                  </div>
                  <h2 className="font-bold text-base md:text-lg text-[#0a1f44] leading-snug line-clamp-2 group-hover:text-[#c8102e] transition-colors">
                    {n.title}
                  </h2>
                  {(n.summary || n.content) && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {cleanText(n.summary || n.content?.slice(0, 200))}
                    </p>
                  )}
                  {n.podcast_link && (
                    <span className="inline-block mt-3 text-xs font-semibold text-[#c8102e]">
                      🎙️ Com podcast
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal de leitura */}
        {open && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
            onClick={() => setOpen(null)}
          >
            <div
              className="relative bg-background rounded-2xl max-w-3xl w-full my-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(null)}
                aria-label="Fechar"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                ✕
              </button>
              <div className="overflow-y-auto flex-1">
                {open.image_url && (
                  <img src={safeImageUrl(open.image_url)} alt={open.title} referrerPolicy="no-referrer" className="w-full max-h-80 object-cover" />
                )}
                <div className="p-6 sm:p-8">
                  <div className="text-xs uppercase tracking-wider font-bold text-[#c8102e] mb-2">
                    {fmtDate(open.updated_at || open.created_at)}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0c2651] mb-4">{open.title}</h2>
                  {open.summary && (
                    <p className="text-base font-medium text-foreground/90 mb-4">{cleanText(open.summary)}</p>
                  )}
                  {open.content && (
                    <div className="text-base text-foreground/80 whitespace-pre-line leading-relaxed">
                      {cleanText(open.content)}
                    </div>
                  )}
                  {open.podcast_link && (
                    <a
                      href={open.podcast_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-full bg-[#c8102e] text-white font-semibold hover:bg-[#a30d24] transition"
                    >
                      🎙️ Ouvir Podcast
                    </a>
                  )}
                </div>
              </div>
              {/* Rodapé fixo com botão Fechar */}
              <div className="border-t bg-background p-4 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setOpen(null)}
                  className="px-6 py-2.5 rounded-full bg-[#0c2651] text-white font-semibold hover:bg-[#0c2651]/90 transition inline-flex items-center gap-2"
                >
                  ← Fechar notícia
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
