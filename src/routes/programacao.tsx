import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getProgramacao, type ProgramacaoItem } from "@/lib/public-api";

export const Route = createFileRoute("/programacao")({
  head: () => ({
    meta: [
      { title: "Programação | TOP100 FM" },
      { name: "description", content: "Confira a programação completa da Rádio TOP100 FM dia a dia." },
      { property: "og:title", content: "Programação | TOP100 FM" },
      { property: "og:description", content: "Programação completa da TOP100 FM." },
    ],
  }),
  loader: () => getProgramacao(),
  component: ProgramacaoPage,
});

const DAYS = [
  { idx: 0, label: "Domingo", short: "Dom" },
  { idx: 1, label: "Segunda", short: "Seg" },
  { idx: 2, label: "Terça", short: "Ter" },
  { idx: 3, label: "Quarta", short: "Qua" },
  { idx: 4, label: "Quinta", short: "Qui" },
  { idx: 5, label: "Sexta", short: "Sex" },
  { idx: 6, label: "Sábado", short: "Sáb" },
];

const fmt = (t: string) => t?.slice(0, 5) ?? "";

function ProgramacaoPage() {
  const items = (Route.useLoaderData() as ProgramacaoItem[]).filter(
    (p) => p.program_name !== "__probe__"
  );
  // Inicia com valores estáveis no SSR para evitar mismatch de hidratação;
  // os valores reais (dia/hora atuais) são definidos apenas no cliente.
  const [day, setDay] = useState<number>(0);
  const [now, setNow] = useState<string>("");
  const [today, setToday] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialDay = new Date().getDay();
    setMounted(true);
    setToday(initialDay);
    setDay(initialDay);
    setNow(new Date().toTimeString().slice(0, 5));
    const t = setInterval(() => setNow(new Date().toTimeString().slice(0, 5)), 30_000);
    return () => clearInterval(t);
  }, []);

  const dayItems = useMemo(
    () => items.filter((p) => p.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [items, day]
  );

  const liveNowIdx = useMemo(() => {
    if (day !== today) return -1;
    return dayItems.findIndex((p) => now >= fmt(p.start_time) && now < fmt(p.end_time));
  }, [dayItems, day, today, now]);

  const totalPrograms = dayItems.length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO — moderno, com glow e grid sutil */}
      <section className="relative overflow-hidden bg-[#0a1f44] text-white">
        {/* glow radial */}
        <div className="pointer-events-none absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[#c8102e]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full bg-[#1a3a7a]/60 blur-3xl" />
        {/* grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8102e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c8102e]" />
            </span>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-white/90">
              Grade semanal · ao vivo
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
            Nossa{" "}
            <span className="bg-gradient-to-r from-white via-white to-[#ff5470] bg-clip-text text-transparent">
              Programação
            </span>
          </h1>
          <p className="mt-4 text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
            Acompanhe os programas da TOP100 FM ao longo da semana. Toque em um dia para ver a grade completa em tempo real.
          </p>

          {/* mini stats */}
          <div className="mt-8 flex flex-wrap gap-2 md:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs">
              <span className="text-white/50">Hoje</span>
              <span className="font-bold capitalize">{mounted ? DAYS[today].label : "—"}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs">
              <span className="text-white/50">Agora</span>
              <span className="font-mono font-bold tabular-nums">{mounted ? now : "--:--"}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs">
              <span className="text-white/50">Programas</span>
              <span className="font-bold">{totalPrograms}</span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        {/* TABS DE DIAS — pílulas modernas, scroll horizontal mobile */}
        <div className="mb-10 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 md:gap-2.5 overflow-x-auto overflow-y-visible pt-3 pb-3 md:flex-wrap md:justify-center scrollbar-thin">
            {DAYS.map((d) => {
              const active = day === d.idx;
              const isToday = today === d.idx;
              return (
                <button
                  key={d.idx}
                  onClick={() => setDay(d.idx)}
                  className={`group relative shrink-0 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    active
                      ? "bg-[#c8102e] text-white shadow-[0_8px_24px_-8px_rgba(200,16,46,0.6)] scale-[1.03]"
                      : "bg-white text-[#0a1f44] border border-gray-200 hover:border-[#c8102e]/50 hover:text-[#c8102e] hover:-translate-y-0.5"
                  }`}
                >
                  <span className="sm:hidden">{d.short}</span>
                  <span className="hidden sm:inline">{d.label}</span>
                  {isToday && (
                    <span
                      className={`absolute -top-1.5 -right-1 text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none tracking-wider ${
                        active ? "bg-white text-[#c8102e]" : "bg-[#c8102e] text-white shadow-md"
                      }`}
                    >
                      HOJE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTA DE PROGRAMAS — timeline */}
        {dayItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-10 md:p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a] text-white text-2xl">
              🎙️
            </div>
            <p className="text-base md:text-lg font-bold text-[#0a1f44]">
              Sem programas para {DAYS[day].label.toLowerCase()}
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              A grade está sendo atualizada. Volte em breve para conferir as novidades.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* linha vertical timeline (desktop) */}
            <div className="hidden md:block absolute left-[88px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

            <ul className="space-y-2.5 md:space-y-3">
              {dayItems.map((p, i) => {
                const isLive = i === liveNowIdx;
                const isPast =
                  day === today && now >= fmt(p.end_time) && !isLive;

                return (
                  <li key={p.id} className="relative">
                    <article
                      className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                        isLive
                          ? "border-[#c8102e]/60 shadow-[0_12px_32px_-12px_rgba(200,16,46,0.35)] ring-1 ring-[#c8102e]/20"
                          : "border-gray-200/80 hover:border-[#0a1f44]/30 hover:shadow-lg hover:-translate-y-0.5"
                      } ${isPast ? "opacity-55" : ""}`}
                    >
                      {/* glow no card live */}
                      {isLive && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#c8102e]/[0.04] via-transparent to-transparent" />
                      )}

                      <div className="relative flex items-stretch">
                        {/* Coluna horário */}
                        <div className="flex flex-col items-center justify-center px-4 md:px-5 py-4 md:py-5 min-w-[88px] md:min-w-[112px] border-r border-gray-100">
                          <div
                            className={`text-xl md:text-2xl font-black leading-none font-mono tabular-nums ${
                              isLive ? "text-[#c8102e]" : "text-[#0a1f44]"
                            }`}
                          >
                            {fmt(p.start_time)}
                          </div>
                          <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5 font-semibold">
                            às {fmt(p.end_time)}
                          </div>
                        </div>

                        {/* Bolinha timeline (desktop) */}
                        <div className="hidden md:flex absolute left-[88px] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                              isLive
                                ? "bg-[#c8102e] animate-pulse"
                                : isPast
                                ? "bg-gray-300"
                                : "bg-[#0a1f44]"
                            }`}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-5 flex flex-col justify-center">
                          <div className="flex items-start gap-2 flex-wrap mb-1">
                            <h3
                              className={`font-black text-base md:text-xl tracking-tight leading-tight ${
                                isLive ? "text-[#c8102e]" : "text-[#0a1f44]"
                              }`}
                            >
                              {p.program_name}
                            </h3>
                            {isLive && (
                              <span className="inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase bg-[#c8102e] text-white px-2 py-1 rounded-full shadow-sm tracking-wider">
                                <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                                No ar
                              </span>
                            )}
                            {isPast && (
                              <span className="inline-flex items-center text-[9px] md:text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded-full tracking-wider">
                                Encerrado
                              </span>
                            )}
                          </div>
                          {p.presenter && (
                            <p className="text-xs md:text-sm text-muted-foreground">
                              <span className="text-[#c8102e] font-semibold">com</span>{" "}
                              <span className="font-medium text-foreground/80">{p.presenter}</span>
                            </p>
                          )}
                        </div>

                        {/* Flyer thumbnail */}
                        {p.flyer_url && (
                          <div className="flex-shrink-0 pr-4 py-4 flex items-center">
                            <img
                              src={p.flyer_url}
                              alt={`Flyer ${p.program_name}`}
                              className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-gray-100 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* CTA voltar home */}
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
