import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getActivePodcasts, type PodcastItem } from "@/lib/public-api";

export const Route = createFileRoute("/podcasts")({
  head: () => ({
    meta: [
      { title: "Podcasts | TOP100 FM" },
      { name: "description", content: "Ouça os podcasts da Rádio TOP100 FM quando e onde quiser." },
      { property: "og:title", content: "Podcasts | TOP100 FM" },
    ],
  }),
  loader: () => getActivePodcasts(),
  component: PodcastsPage,
});

function getYtId(url: string): string | null {
  const m = url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

function PodcastsPage() {
  const podcasts = Route.useLoaderData() as PodcastItem[];
  const [playing, setPlaying] = useState<string | null>(null);

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
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">Ouça quando quiser</span>
          </div>
          <h1 className="font-display text-7xl sm:text-8xl md:text-[110px] text-white">
            Podcasts
          </h1>
          <p className="mt-3 text-white/60 max-w-xl text-sm md:text-base">
            Todos os episódios e transmissões gravadas da TOP100 FM em um só lugar.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs">
            <span className="text-white/50">Episódios</span>
            <span className="font-bold text-white">{podcasts.length}</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {podcasts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-10 md:p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a] text-white text-2xl">
              🎧
            </div>
            <p className="text-base md:text-lg font-bold text-[#0a1f44]">Nenhum podcast publicado ainda</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Em breve novos episódios serão adicionados aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {podcasts.map((p) => {
              const ytId = getYtId(p.youtube_url);
              const thumb = p.thumbnail_url || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "");
              const isPlaying = playing === p.id;

              return (
                <article
                  key={p.id}
                  className="group rounded-2xl bg-white overflow-hidden card-shadow transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Thumbnail / Player */}
                  <div className="relative w-full aspect-video bg-[#0a1f44] overflow-hidden">
                    {isPlaying && ytId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <>
                        {thumb && (
                          <img
                            src={thumb}
                            alt={p.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setPlaying(p.id)}
                            className="h-14 w-14 rounded-full bg-white text-[#c8102e] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                            aria-label="Reproduzir"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 ml-1">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                        {/* Badge play sempre visível */}
                        <div className="absolute bottom-2 right-2">
                          <button
                            onClick={() => setPlaying(p.id)}
                            className="h-10 w-10 rounded-full bg-[#c8102e] text-white flex items-center justify-center shadow-lg hover:bg-[#a00d24] hover:scale-105 transition-all"
                            aria-label="Reproduzir"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 ml-0.5">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="font-bold text-[#0a1f44] text-sm md:text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-[#c8102e] transition-colors">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
                    <a
                      href={p.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c8102e] hover:underline"
                    >
                      Abrir no YouTube →
                    </a>
                  </div>
                </article>
              );
            })}
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
    </div>
  );
}
