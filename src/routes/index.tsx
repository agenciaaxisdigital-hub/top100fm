import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PromotionPopup } from "@/components/PromotionPopup";
import { PromotionDetailsModal } from "@/components/PromotionDetailsModal";
import { AudioActivationOverlay } from "@/components/AudioActivationOverlay";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { subscribePublicTables } from "@/lib/supabase-public-refresh";
import { safeImageUrl } from "@/lib/utils";
import mascoteTop from "@/assets/mascote-top.png";
import illustGift from "@/assets/illust-promo-gift.png";
import axisDigitalLogo from "@/assets/axis-digital.png";
import draFernandaSarelliLogo from "@/assets/dra-fernanda-sarelli.png";

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

type PodcastItem = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
};

function PodcastCardDark({
  p,
  isPlaying,
  onPlay,
}: {
  p: PodcastItem;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const ytId = getYoutubeId(p.youtube_url);
  const thumb = p.thumbnail_url || (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : "");
  return (
    <article className="rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition flex flex-col">
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {isPlaying && ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
            title={p.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={onPlay}
            className="group w-full h-full flex items-center justify-center bg-cover bg-center"
            style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
            aria-label={`Reproduzir ${p.title}`}
          >
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffc107] text-[#0c2651] shadow-xl group-hover:scale-110 transition">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2 text-center items-center">
        <h4 className="font-bold leading-tight text-white line-clamp-2">{p.title}</h4>
        {p.description && (
          <p className="text-xs text-white/70 line-clamp-2">{p.description}</p>
        )}
        {!isPlaying && (
          <button
            type="button"
            onClick={onPlay}
            className="mt-auto text-[11px] uppercase font-black bg-[#ffc107] text-[#0c2651] px-4 py-1.5 rounded-full hover:bg-white transition"
          >
            ▶ Escutar
          </button>
        )}
      </div>
    </article>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rádio TOP100 FM - Ao Vivo" },
      { name: "description", content: "Notícias, programação e podcasts da Rádio TOP100 FM. Ouça ao vivo!" },
      { property: "og:title", content: "Rádio TOP100 FM - Ao Vivo" },
      { property: "og:description", content: "Notícias, programação e podcasts da TOP100 FM." },
    ],
  }),
  component: IndexPage,
});

type NewsItem = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type ProgItem = {
  id: string;
  day_of_week: number;
  program_name: string;
  presenter: string | null;
  start_time: string;
  end_time: string;
  flyer_url: string | null;
};

type PromoItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
};

type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  link?: string;
  display_order?: number;
  is_active?: boolean;
};



const SPONSOR_LOGO_FALLBACKS: Record<string, string> = {
  "axis-digital": axisDigitalLogo,
  "dra-fernanda-sarelli": draFernandaSarelliLogo,
};

const normalizeSponsorLogo = (s: Sponsor): Sponsor => {
  const fallback = SPONSOR_LOGO_FALLBACKS[s.id];
  if (!fallback) return s;
  if (!s.logo_url || s.logo_url.startsWith("/sponsors/")) {
    return { ...s, logo_url: fallback };
  }
  return s;
};

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function fmtDate(d: string | null) {
  return new Date(d || Date.now()).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function cleanText(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function fmtTime(t: string) {
  return t?.slice(0, 5) || "";
}

function IndexPage() {
  const { settings: rootSettings } = useLoaderData({ from: "__root__" }) as { settings?: Record<string, any> };
  const homeSocialLinks: Array<{ name: string; url: string }> = Array.isArray(rootSettings?.social_links) ? rootSettings.social_links : [];
  const [news, setNews] = useState<NewsItem[]>([]);
  const [prog, setProg] = useState<ProgItem[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [playingPodcast, setPlayingPodcast] = useState<string | null>(null);
  const [podcastModalOpen, setPodcastModalOpen] = useState(false);
  const [modalPlayingPodcast, setModalPlayingPodcast] = useState<string | null>(null);
  const [liveStream, setLiveStream] = useState<{ active: boolean; url: string | null; title: string | null }>({ active: false, url: null, title: null });
  const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null);
  const [openNews, setOpenNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(today);
  const nowHHMM = new Date().toTimeString().slice(0, 5);

  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadHomeData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent === true;
      if (!silent) setLoading(true);
      try {
        const [n, p, pr, sp, pc] = await Promise.all([
          (supabase as any)
            .from("news")
            .select("id,title,summary,content,image_url,updated_at,created_at,is_pinned,pinned_at")
            .eq("is_published", true)
            .order("is_pinned", { ascending: false })
            .order("pinned_at", { ascending: false, nullsFirst: false })
            .order("updated_at", { ascending: false })
            .limit(7),
          (supabase as any)
            .from("programacao")
            .select("id,day_of_week,program_name,presenter,start_time,end_time,flyer_url")
            .eq("is_active", true)
            .neq("program_name", "__probe__")
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase
            .from("promotions")
            .select("id,title,description,image_url,link")
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .limit(3),
          (supabase as any)
            .from("site_settings")
            .select("setting_key,setting_value")
            .in("setting_key", ["sponsors", "live_active", "live_url", "live_title"]),
          (supabase as any)
            .from("podcasts")
            .select("id,title,description,youtube_url,thumbnail_url")
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false })
            .limit(6),
        ]);
        setNews((n.data as any) || []);
        setProg((p.data as any) || []);
        setPromos(((pr.data as any) || []) as PromoItem[]);
        try {
          const rows = ((sp as any)?.data || []) as Array<{ setting_key: string; setting_value: any }>;
          const map: Record<string, any> = {};
          for (const r of rows) {
            let v = r.setting_value;
            if (typeof v === "string") {
              try {
                v = JSON.parse(v);
              } catch {
                /* keep */
              }
            }
            map[r.setting_key] = v;
          }
          const list = (Array.isArray(map.sponsors) ? map.sponsors : []) as Sponsor[];
          const filtered = list
            .filter((s) => s.is_active !== false && (s.logo_url || SPONSOR_LOGO_FALLBACKS[s.id]))
            .map(normalizeSponsorLogo)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          setSponsors(filtered);
          setLiveStream({
            active: map["live_active"] === "true" || map["live_active"] === true,
            url: map["live_url"] || null,
            title: map["live_title"] || null,
          });
        } catch {
          setSponsors([]);
        }
        setPodcasts(((pc as any)?.data as PodcastItem[]) || []);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  const scheduleSilentReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      reloadTimer.current = null;
      void loadHomeData({ silent: true });
    }, 450);
  }, [loadHomeData]);

  useEffect(() => {
    void loadHomeData({ silent: false });
  }, [loadHomeData]);

  useEffect(() => {
    const cancel = subscribePublicTables(
      supabase,
      ["news", "programacao", "promotions", "site_settings", "podcasts"],
      scheduleSilentReload,
    );
    return cancel;
  }, [scheduleSilentReload]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") scheduleSilentReload();
    };
    const onFocus = () => scheduleSilentReload();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [scheduleSilentReload]);

  // ESC fecha modal de notícia + trava scroll
  useEffect(() => {
    if (!openNews) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenNews(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openNews]);

  // Notícias logic
  const featured = news[0];
  const secondary = news.slice(1, 3);
  const rest = news.slice(3, 7);

  return (
    <div style={{ width: "100%", margin: 0 }}>
      <SiteHeader />
      <PromotionPopup />
      <AudioActivationOverlay />

      <main className="bg-[#f4f6fb]">
        {/* HERO DE PROMOÇÕES — réplica fiel da produção */}
        <section className="relative overflow-hidden bg-[#0a1f4a]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#1a3a8c_0%,#0a1f4a_48%,#06122d_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-[24rem] w-[24rem] rounded-full bg-[#c8102e]/35 blur-[110px]"
            animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 left-0 h-[26rem] w-[26rem] rounded-full bg-[#ffd84d]/18 blur-[120px]"
            animate={{ scale: [1.08, 1, 1.08], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Patrícia — sempre visível no desktop */}
          <img
            src={mascoteTop}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 z-0 hidden h-full w-1/2 select-none object-cover object-right opacity-90 lg:block"
            style={{
              maskImage: "linear-gradient(to right, transparent 0%, black 40%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%, black 100%)",
            }}
          />

          <div className="relative mx-auto max-w-7xl px-3 sm:px-4 pt-6 pb-8 lg:pt-16 lg:pb-20">
            {/* Mobile/tablet: ao vivo OU Patrícia */}
            <div className="relative mb-5 overflow-hidden rounded-[22px] border border-white/15 bg-gradient-to-br from-[#1a3a8c]/40 to-[#0a1f4a]/60 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.6)] lg:hidden">
              {liveStream.active && liveStream.url ? (
                /* AO VIVO no mobile */
                <>
                  <div className="relative w-full aspect-video bg-black">
                    {getYoutubeId(liveStream.url) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeId(liveStream.url)}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                        title={liveStream.title || "Transmissão ao vivo"}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <a
                        href={liveStream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-full w-full items-center justify-center gap-2 bg-[#0a1f44] text-white font-bold text-sm"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-[#c8102e] animate-pulse" />
                        Assistir ao vivo →
                      </a>
                    )}
                    {/* Badge AO VIVO */}
                    <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8102e] opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#c8102e]" />
                      </span>
                      Ao Vivo
                    </div>
                    <p className="absolute bottom-1.5 right-2 text-[9px] text-white/40">
                      🔇 Toque para ativar som
                    </p>
                  </div>
                  <a
                    href={liveStream.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#c8102e] text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-[#a30d24] transition"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    Assistir no YouTube
                  </a>
                </>
              ) : (
                /* Foto padrão */
                <>
                  <img
                    src={mascoteTop}
                    alt="Patrícia nas promoções da TOP100 FM"
                    className="h-[200px] w-full object-cover object-center sm:h-[300px]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a1f4a] via-[#0a1f4a]/70 to-transparent" />
                  <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#ffd84d] backdrop-blur-md">
                    Promoções
                  </div>
                </>
              )}
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-12">
              <div className="relative z-10 lg:col-span-6">
                <motion.span
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[#ffd84d] backdrop-blur"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ffd84d] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ffd84d]" />
                  </span>
                  Concorra agora
                </motion.span>

                <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-white">
                  Participe e{" "}
                  <span className="bg-gradient-to-r from-[#ffd84d] via-[#ff9a3c] to-[#ff5470] bg-clip-text text-transparent">
                    concorra a prêmios incríveis
                  </span>
                </h2>
                <p className="mt-2 text-sm text-white/80">
                  Escolha uma promoção abaixo, faça seu cadastro e dispute o prêmio 🎁
                </p>

                <div className="mt-5 flex flex-col gap-2.5">
                  {promos.slice(0, 3).map((p, i) => (
                    <motion.button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPromo(p)}
                      whileHover={{ y: -4, scale: 1.015 }}
                      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 sm:p-3 text-left backdrop-blur transition hover:border-[#ffd84d]/40 hover:bg-white/[0.1] hover:shadow-[0_20px_50px_-20px_rgba(255,216,77,0.5)]"
                    >
                      <div className="relative h-20 w-20 sm:h-28 sm:w-28 shrink-0">
                        <div
                          aria-hidden
                          className="absolute -inset-1 rounded-2xl opacity-60 blur-md transition group-hover:opacity-90"
                          style={{ background: "radial-gradient(circle, rgba(255,216,77,0.55) 0%, rgba(255,84,112,0.3) 50%, transparent 75%)" }}
                        />
                        <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-white/25 bg-gradient-to-br from-[#c8102e] via-[#a00d24] to-[#0c2651] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)]">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <img src={illustGift} alt="" className="h-12 w-12 sm:h-16 sm:w-16 object-contain drop-shadow-lg" loading="lazy" width={64} height={64} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd84d]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#ffd84d]">
                          Promo {i + 1}
                        </span>
                        <h3 className="mt-1 text-sm sm:text-base font-black leading-tight text-white line-clamp-2">
                          {p.title}
                        </h3>
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#ff9a3c] transition-all group-hover:gap-2">
                          Participar <span>→</span>
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Redes sociais — hardcoded, sempre visível */}
                <div className="mt-5 flex items-center gap-3">
                  <a href="https://www.instagram.com/top100fmoficial" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="https://wa.me/5562818808950?text=Ol%C3%A1%2C%20TOP100%20FM!" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                  <a href="https://www.youtube.com/@top100fmoficial" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <svg className="block h-12 w-full text-background lg:h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
            <path fill="currentColor" d="M0,40 C360,90 1080,-10 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </section>

        {/* AO VIVO — logo abaixo do hero, autoplay mudo (hidden on mobile — shown in hero card instead) */}
        {liveStream.active && liveStream.url && (
          <section className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-[#0a1f44] via-[#0c2651] to-[#06122d] text-white py-10 md:py-14">
            <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
            <div className="relative mx-auto max-w-5xl px-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8102e] opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-[#c8102e]" />
                </span>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-[#c8102e]">Ao Vivo</span>
              </div>
              {liveStream.title && (
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-4">{liveStream.title}</h2>
              )}
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                {(() => {
                  const ytId = getYoutubeId(liveStream.url);
                  if (ytId) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                        title={liveStream.title || "Transmissão ao vivo TOP100 FM"}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <a
                      href={liveStream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full items-center justify-center gap-3 bg-[#0a1f44] hover:bg-[#1a3a7a] transition text-white font-bold text-lg"
                    >
                      <span className="h-3 w-3 rounded-full bg-[#c8102e] animate-pulse" />
                      Assistir transmissão ao vivo →
                    </a>
                  );
                })()}
              </div>
              <p className="mt-3 text-xs text-white/40 text-center">
                🔇 Iniciando sem som — clique no vídeo para ativar o áudio
              </p>
              <div className="mt-5 flex justify-center">
                <a
                  href={liveStream.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full bg-[#c8102e] text-white px-7 py-3.5 text-sm font-bold shadow-[0_8px_24px_-8px_rgba(200,16,46,0.6)] hover:bg-[#a30d24] hover:-translate-y-0.5 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden>
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Assistir no YouTube →
                </a>
              </div>
            </div>
          </section>
        )}

        {/* HERO + NOTÍCIAS DESTAQUE */}
        <section className="mx-auto max-w-7xl px-3 sm:px-4 pt-6 sm:pt-8 pb-10 sm:pb-12">
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#c8102e] to-[#0c2651]" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8102e]">
                  Em alta
                </p>
                <h2 className="font-display text-4xl md:text-5xl text-[#0a1f44]">
                  Últimas Notícias
                </h2>
              </div>
            </div>
            <Link
              to="/noticias"
              className="group inline-flex items-center gap-1.5 rounded-full border border-[#c8102e]/20 bg-white px-4 py-2 text-sm font-bold text-[#c8102e] shadow-sm transition hover:bg-[#c8102e] hover:text-white hover:shadow-md"
            >
              Ver todas
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card animate-pulse h-72" />
              ))}
            </div>
          ) : !featured ? (
            <div className="rounded-xl border bg-card p-10 text-center">
              <p className="text-lg text-muted-foreground">Nenhuma notícia publicada ainda.</p>
              <p className="text-sm text-muted-foreground mt-2">Cadastre no painel administrativo.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* DESTAQUE GRANDE */}
              <button
                type="button"
                onClick={() => setOpenNews(featured)}
                className="lg:col-span-2 group relative rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-xl transition text-left"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden">
                  {featured.image_url ? (
                    <img
                      src={safeImageUrl(featured.image_url)}
                      alt={featured.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#c8102e] to-[#0c2651] flex items-center justify-center">
                      <span className="text-white text-7xl">📻</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                  {featured.is_pinned && (
                    <span className="inline-block bg-[#c8102e] text-white text-xs font-bold uppercase px-2 py-1 rounded mb-2">
                      Destaque
                    </span>
                  )}
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight line-clamp-3">
                    {featured.title}
                  </h3>
                  {featured.summary && (
                    <p className="mt-2 text-white/90 text-sm md:text-base line-clamp-2">
                      {cleanText(featured.summary)}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-white/70 uppercase tracking-wider">
                    {fmtDate(featured.updated_at || featured.created_at)}
                  </p>
                </div>
              </button>

              {/* 2 SECUNDÁRIAS */}
              <div className="grid gap-6 grid-cols-1">
                {secondary.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setOpenNews(n)}
                    className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition flex text-left"
                  >
                    {n.image_url ? (
                      <div className="w-32 sm:w-40 flex-shrink-0 bg-muted">
                        <img src={safeImageUrl(n.image_url)} alt={n.title} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 sm:w-40 flex-shrink-0 bg-gradient-to-br from-[#c8102e] to-[#0c2651]" />
                    )}
                    <div className="p-4 flex-1">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-[#c8102e] mb-1">
                        {fmtDate(n.updated_at || n.created_at)}
                      </p>
                      <h4 className="font-bold text-[#0c2651] leading-snug line-clamp-3 group-hover:text-[#c8102e] transition">
                        {n.title}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MAIS NOTÍCIAS */}
          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {rest.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setOpenNews(n)}
                  className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition text-left"
                >
                  <div className="aspect-video bg-muted overflow-hidden">
                    {n.image_url ? (
                      <img src={safeImageUrl(n.image_url)} alt={n.title} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#c8102e] to-[#0c2651]" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] uppercase font-bold text-[#c8102e] mb-1">
                      {fmtDate(n.updated_at || n.created_at)}
                    </p>
                    <h4 className="font-bold text-sm text-[#0c2651] line-clamp-2">{n.title}</h4>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* BOTÃO VER MAIS NOTÍCIAS */}
          {news.length > 0 && (
            <div className="mt-10 flex justify-center">
              <Link
                to="/noticias"
                className="inline-flex items-center gap-2 rounded-full bg-[#c8102e] text-white px-7 py-3 text-sm font-bold shadow-md hover:bg-[#a30d24] hover:shadow-lg transition"
              >
                Ver mais notícias
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          )}
        </section>

        {/* MODAL DE LEITURA DE NOTÍCIA */}
        {openNews && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
            onClick={() => setOpenNews(null)}
          >
            <div
              className="relative bg-background rounded-2xl max-w-3xl w-full my-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpenNews(null)}
                aria-label="Fechar"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                ✕
              </button>
              <div className="overflow-y-auto flex-1">
                {openNews.image_url && (
                  <img src={safeImageUrl(openNews.image_url)} alt={openNews.title} referrerPolicy="no-referrer" className="w-full max-h-80 object-cover" />
                )}
                <div className="p-6 sm:p-8">
                  <div className="text-xs uppercase tracking-wider font-bold text-[#c8102e] mb-2">
                    {fmtDate(openNews.updated_at || openNews.created_at)}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0c2651] mb-4">{openNews.title}</h2>
                  {openNews.summary && (
                    <p className="text-base font-medium text-foreground/90 mb-4">{cleanText(openNews.summary)}</p>
                  )}
                  {openNews.content && (
                    <div className="text-base text-foreground/80 whitespace-pre-line leading-relaxed">
                      {cleanText(openNews.content)}
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t bg-background p-4 flex justify-between gap-3 shrink-0 flex-wrap">
                <button
                  onClick={() => setOpenNews(null)}
                  className="px-6 py-2.5 rounded-full bg-[#0c2651] text-white font-semibold hover:bg-[#0c2651]/90 transition inline-flex items-center gap-2"
                >
                  ← Voltar
                </button>
                <Link
                  to="/noticias"
                  onClick={() => setOpenNews(null)}
                  className="px-6 py-2.5 rounded-full bg-[#c8102e] text-white font-semibold hover:bg-[#a30d24] transition inline-flex items-center gap-2"
                >
                  Ver mais notícias →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PROGRAMAÇÃO SEMANAL */}
        <section className="relative overflow-x-hidden bg-gradient-to-br from-[#0c2651] via-[#0c2651] to-[#1a3a7a] text-white py-14">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="h-8 w-1.5 rounded-full bg-[#c8102e]" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#c8102e]">
                    Toda a semana
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl text-white">
                    Programação Semanal
                  </h2>
                </div>
              </div>
              <Link
                to="/programacao"
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-[#0c2651]"
              >
                Ver grade completa
                <span className="transition group-hover:translate-x-0.5">→</span>
              </Link>
            </div>

            {/* Abas de dias */}
            <div className="flex gap-2 overflow-x-auto pt-3 pb-3 mb-5 scrollbar-thin">
              {DAYS.map((label, idx) => {
                const isActive = selectedDay === idx;
                const isToday = today === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDay(idx)}
                    className={`relative shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-[#c8102e] text-white shadow-[0_6px_20px_-6px_rgba(200,16,46,0.7)]"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{DAYS_SHORT[idx]}</span>
                    {isToday && (
                      <span className={`absolute -top-1 -right-0.5 text-[7px] font-black px-1 py-0.5 rounded-full leading-none ${
                        isActive ? "bg-white text-[#c8102e]" : "bg-[#c8102e] text-white"
                      }`}>
                        HOJE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {prog.filter((p) => p.day_of_week === selectedDay).length === 0 ? (
              <div className="rounded-xl bg-white/5 p-8 text-center text-white/70">
                Nenhum programa cadastrado para {DAYS[selectedDay].toLowerCase()}.
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {prog.filter((p) => p.day_of_week === selectedDay).map((p) => {
                  const isLive = selectedDay === today && nowHHMM >= p.start_time.slice(0, 5) && nowHHMM < p.end_time.slice(0, 5);
                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border overflow-hidden transition ${
                        isLive
                          ? "border-[#c8102e] shadow-lg shadow-red-900/50"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      {p.flyer_url && (
                        <div className="w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                          <img src={p.flyer_url} alt={`Flyer ${p.program_name}`} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className={`p-3 ${isLive ? "bg-[#c8102e]" : "bg-white/5"}`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-xs font-bold opacity-90">
                            {fmtTime(p.start_time)} – {fmtTime(p.end_time)}
                          </span>
                          {isLive && (
                            <span className="text-[9px] uppercase font-black bg-white text-[#c8102e] px-1.5 py-0.5 rounded animate-pulse">
                              No ar
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm leading-tight">{p.program_name}</h4>
                        {p.presenter && <p className="text-xs text-white/65 mt-0.5">com {p.presenter}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>


        {/* PODCASTS */}
        {true && (
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0c2651] via-[#0c2651] to-[#1a3a7a] text-white py-14">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="relative mx-auto max-w-7xl px-4">
              <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-1.5 rounded-full bg-[#c8102e]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                      No ar quando quiser
                    </p>
                    <h2 className="font-display text-4xl md:text-5xl text-white">
                      Podcasts
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {podcasts.slice(0, 3).map((p) => (
                  <PodcastCardDark
                    key={p.id}
                    p={p}
                    isPlaying={playingPodcast === p.id}
                    onPlay={() => setPlayingPodcast(p.id)}
                  />
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  to="/podcasts"
                  className="inline-flex items-center gap-2 rounded-full bg-[#ffc107] px-7 py-3 text-sm font-black uppercase tracking-wide text-[#0c2651] shadow-xl hover:scale-105 transition-transform"
                >
                  Ver todos os podcasts {podcasts.length > 0 ? `(${podcasts.length})` : ""}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* PATROCINADORES */}
        {sponsors.length > 0 && (
          <section className="bg-white py-14 border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-[#c8102e] to-[#0c2651]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">
                      Quem apoia
                    </p>
                    <h2 className="font-display text-4xl md:text-5xl text-[#0a1f44] mt-0.5">
                      Nossos Patrocinadores
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs hidden md:block">
                  Marcas que acreditam no rádio e fazem a TOP100 FM acontecer todos os dias.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-4">
                {sponsors.map((s) => {
                  const Wrapper: any = s.link ? "a" : "div";
                  const wrapperProps = s.link
                    ? { href: s.link, target: "_blank", rel: "noopener" }
                    : {};
                  return (
                    <Wrapper
                      key={s.id}
                      {...wrapperProps}
                      className={`group relative rounded-2xl border border-gray-200 bg-white ${
                        s.link
                          ? "hover:border-[#c8102e]/40 hover:shadow-lg hover:-translate-y-1"
                          : ""
                      } transition-all duration-300 flex flex-col items-center justify-center text-center p-3 sm:p-5 gap-2 sm:gap-3 min-h-[150px] sm:min-h-[200px]`}
                    >
                      <div className="flex items-center justify-center h-20 sm:h-28 w-full">
                        <img
                          src={s.logo_url}
                          alt={s.name}
                          className="max-h-20 sm:max-h-28 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="text-[11px] sm:text-sm font-bold text-[#0c2651] group-hover:text-[#c8102e] transition tracking-tight leading-tight line-clamp-2">
                        {s.name}
                      </div>
                    </Wrapper>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <a
                  href="https://wa.me/5562818808950?text=Quero%20ser%20patrocinador%20da%20TOP100%20FM"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-[#c8102e]/30 bg-white px-5 py-2.5 text-sm font-bold text-[#c8102e] hover:bg-[#c8102e] hover:text-white hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  Quero anunciar na TOP100 FM
                  <span>→</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* REDES SOCIAIS */}
        {homeSocialLinks.length > 0 && (
          <section className="bg-[#060f22] py-14">
            <div className="mx-auto max-w-4xl px-4 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30 mb-2">Siga a rádio</p>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-10">Redes Sociais</h2>
              <div className="flex flex-wrap justify-center gap-5 md:gap-6">
                {homeSocialLinks.map((link, i) => {
                  const url = link.url || "";
                  const name = link.name || "";
                  const isInsta = url.includes("instagram");
                  const isWhatsApp = url.includes("wa.me") || url.includes("whatsapp");
                  const isYoutube = url.includes("youtube") || url.includes("youtu.be");
                  const bgClass = isInsta
                    ? "from-[#f09433] via-[#dc2743] to-[#bc1888]"
                    : isWhatsApp
                    ? "from-[#25D366] to-[#128C7E]"
                    : isYoutube
                    ? "from-[#FF0000] to-[#CC0000]"
                    : "from-[#1a3a7a] to-[#0a1f44]";
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${bgClass} p-6 min-w-[140px] text-white shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300`}
                    >
                      {isInsta && (
                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {isWhatsApp && (
                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      )}
                      {isYoutube && (
                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      )}
                      {!isInsta && !isWhatsApp && !isYoutube && (
                        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      )}
                      <span className="text-sm font-bold tracking-wide">{name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {podcastModalOpen && (
          <div
            className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-md p-4 sm:p-8"
            onClick={() => setPodcastModalOpen(false)}
          >
            <div
              className="relative w-full max-w-6xl rounded-2xl bg-gradient-to-br from-[#0c2651] to-[#1a3a7a] p-5 sm:p-7 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-black text-white">🎧 Todos os podcasts</h3>
                <button
                  type="button"
                  onClick={() => setPodcastModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffc107] text-[#0c2651] font-black hover:scale-110 transition"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {podcasts.map((p) => (
                  <PodcastCardDark
                    key={p.id}
                    p={p}
                    isPlaying={modalPlayingPodcast === p.id}
                    onPlay={() => setModalPlayingPodcast(p.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />

      {selectedPromo && (
        <PromotionDetailsModal
          promo={selectedPromo}
          onClose={() => setSelectedPromo(null)}
        />
      )}
    </div>
  );
}
