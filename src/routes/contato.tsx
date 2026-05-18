import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Mail,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato | TOP100 FM" },
      {
        name: "description",
        content:
          "Fale com a Rádio TOP100 FM pelo WhatsApp, e-mail, redes sociais ou visite nosso estúdio em Aparecida de Goiânia.",
      },
      { property: "og:title", content: "Contato | TOP100 FM" },
    ],
  }),
  component: ContatoPage,
});

const WHATSAPP = {
  display: "+55 (62) 98188-0895",
  href: "https://wa.me/5562981880895?text=Ol%C3%A1%2C%20TOP100%20FM!",
};

const EMAIL = "contatotop100fm@gmail.com";


const SOCIAIS = [
  {
    name: "Instagram",
    handle: "@top100fmoficial",
    href: "https://www.instagram.com/top100fmoficial",
    Icon: Instagram,
    gradient: "from-[#feda75] via-[#d62976] to-[#4f5bd5]",
  },
  {
    name: "Facebook",
    handle: "/top100fm",
    href: "https://facebook.com/top100fm",
    Icon: Facebook,
    gradient: "from-[#1877f2] to-[#0a4cc7]",
  },
  {
    name: "YouTube",
    handle: "@top100fmoficial",
    href: "https://www.youtube.com/@top100fmoficial",
    Icon: Youtube,
    gradient: "from-[#ff0000] to-[#990000]",
  },
];


function ContatoPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a1f44] text-white">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#c8102e]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[360px] w-[360px] rounded-full bg-[#1a3a7a]/60 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1.5 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8102e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c8102e]" />
            </span>
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.25em] text-white/90">
              Estamos no ar
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
            Fale com a{" "}
            <span className="bg-gradient-to-r from-white via-white to-[#ff5470] bg-clip-text text-transparent">
              TOP100 FM
            </span>
          </h1>
          <p className="mt-4 text-white/70 max-w-xl text-sm md:text-base leading-relaxed">
            Manda um oi, sugere uma música, participa do programa ou venha visitar nosso estúdio em Aparecida de Goiânia.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { icon: "📻", label: "No ar 24h" },
              { icon: "💬", label: "Resposta rápida" },
              { icon: "📍", label: "Aparecida de Goiânia" },
            ].map((s) => (
              <div key={s.label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80">
                <span>{s.icon}</span> {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-14 space-y-10">

        {/* CANAIS DIRETOS */}
        <section>
          <SectionTitle eyebrow="Canais diretos" title="Fale agora com a gente" />
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href={WHATSAPP.href}
              target="_blank"
              rel="noopener"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#25d366] to-[#128c7e] p-6 shadow-[0_12px_32px_-12px_rgba(37,211,102,0.45)] hover:shadow-[0_18px_48px_-12px_rgba(37,211,102,0.65)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }} />
              <div className="relative flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <MessageCircle className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-1">WhatsApp</div>
                <div className="text-xl md:text-2xl font-black text-white font-mono leading-tight">{WHATSAPP.display}</div>
                <div className="mt-2 text-xs text-white/80 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60 inline-block" />
                  Estúdio · sugestões · participação
                </div>
              </div>
            </a>

            <a
              href={`mailto:${EMAIL}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 hover:border-[#0a1f44]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-[#0a1f44]/5 blur-2xl" />
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0a1f44] to-[#1a3a7a] flex items-center justify-center text-white shadow-md">
                  <Mail className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-[#c8102e] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1">E-mail</div>
                <div className="text-sm md:text-base font-black text-[#0a1f44] truncate group-hover:text-[#c8102e] transition leading-tight">{EMAIL}</div>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300 inline-block" />
                  Imprensa, parcerias & comercial
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* REDES SOCIAIS */}
        <section>
          <SectionTitle eyebrow="Siga & participe" title="Nas redes sociais" />
          <div className="grid gap-4 sm:grid-cols-3">
            {SOCIAIS.map(({ name, handle, href, Icon, gradient }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener"
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                  <div className="text-base font-black text-[#0a1f44] group-hover:text-white transition-colors">{name}</div>
                  <div className="text-xs text-gray-400 group-hover:text-white/80 transition-colors mt-0.5 truncate">{handle}</div>
                </div>
              </a>
            ))}
          </div>
        </section>


        <div className="text-center pt-2">
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

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="h-7 w-1.5 rounded-full bg-gradient-to-b from-[#c8102e] to-[#0a1f44]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c8102e]">{eyebrow}</p>
        <h2 className="text-xl md:text-2xl font-black text-[#0a1f44] tracking-tight leading-none mt-0.5">{title}</h2>
      </div>
    </div>
  );
}
