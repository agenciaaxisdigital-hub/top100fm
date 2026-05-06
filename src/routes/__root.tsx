import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts, useRouteContext } from "@tanstack/react-router";
import { getPublicSiteSettings } from "@/lib/public-api";

import appCss from "../styles.css?url";

type RouterContext = {
  settings?: Record<string, any>;
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: async () => {
    try {
      const settings = await getPublicSiteSettings();
      return { settings };
    } catch {
      return { settings: {} };
    }
  },
  head: ({ loaderData }) => {
    const s = loaderData?.settings || {};
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: s.radio_name || "Rádio TOP100 FM" },
        { name: "description", content: s.radio_description || "Rádio TOP100 FM - A melhor programação musical" },
        { name: "author", content: s.radio_name || "TOP100 FM" },
        { property: "og:title", content: s.radio_name || "Rádio TOP100 FM" },
        { property: "og:description", content: s.radio_description || "Rádio TOP100 FM - A melhor programação musical" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:site", content: "@top100fm" },
        { name: "twitter:title", content: s.radio_name || "Rádio TOP100 FM" },
        { name: "twitter:description", content: s.radio_description || "Rádio TOP100 FM - A melhor programação musical" },
        { property: "og:image", content: s.logo_url || "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2e943593-07e2-44ff-ad54-17cd1ea201ff/id-preview-c5cd9ec5--77a47e7d-3898-45c7-a7b6-1b32959d4461.lovable.app-1776448753297.png" },
        { name: "twitter:image", content: s.logo_url || "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2e943593-07e2-44ff-ad54-17cd1ea201ff/id-preview-c5cd9ec5--77a47e7d-3898-45c7-a7b6-1b32959d4461.lovable.app-1776448753297.png" },
      ],
      links: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://server29.srvsh.com.br:7618", crossOrigin: "anonymous" },
        { rel: "dns-prefetch", href: "https://server29.srvsh.com.br:7618" },
        { rel: "stylesheet", href: appCss },
      ],
    };
  },
  shellComponent: (props) => {
    // Hack to pass settings down to the shell:
    // since shell doesn't receive loaderData, we have to fetch again?
    // Actually, in TanStack Router, shell is rendered before loader completes for document mount.
    // However, the router context is the easiest place.
    return <RootShell children={props.children} />;
  },
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children, settings }: { children: React.ReactNode; settings?: any }) {
  const earlyAutoplay = `
    (function(){
      try {
        var URL='${settings?.stream_url || "https://server29.srvsh.com.br:7618/;"}';
        var a = new Audio();
        a.id = '__top100_early_audio';
        a.preload = 'auto';
        a.autoplay = true;
        a.muted = true;
        a.setAttribute('playsinline','true');
        a.src = URL;
        window.__top100EarlyAudio = a;
        var tryPlay = function(){ try { var p = a.play(); if (p && p.catch) p.catch(function(){}); } catch(e){} };
        tryPlay();
        var unlocked = false;
        var unlock = function(){
          if (unlocked) return; unlocked = true;
          try { a.muted = false; tryPlay(); } catch(e){}
        };
        ['pointerdown','pointermove','mousemove','touchstart','touchmove','keydown','click','wheel','scroll'].forEach(function(ev){
          window.addEventListener(ev, unlock, { passive: true, once: true, capture: true });
          document.addEventListener(ev, unlock, { passive: true, once: true, capture: true });
        });
      } catch(e) {}
    })();
  `;
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyAutoplay }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { settings } = Route.useLoaderData();
  
  // Inject CSS variables for colors if configured
  const inlineStyles: Record<string, string> = {};
  if (settings?.color_primary) {
    inlineStyles['--primary'] = settings.color_primary;
  }
  if (settings?.color_secondary) {
    inlineStyles['--secondary'] = settings.color_secondary;
  }
  
  return (
    <div style={inlineStyles as React.CSSProperties}>
      <Outlet />
    </div>
  );
}
