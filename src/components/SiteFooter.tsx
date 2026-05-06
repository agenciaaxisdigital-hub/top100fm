import { Link, useLoaderData } from "@tanstack/react-router";

export function SiteFooter() {
  const { settings } = useLoaderData({ from: "__root__" }) as { settings?: Record<string, any> };
  const socialLinks = settings?.social_links || [];
  
  return (
    <footer className="site-footer">
      <div className="site-footer-inner !flex-col md:!flex-row !items-start md:!items-center gap-4">
        
        <div className="flex-1 flex flex-col gap-2">
          {(settings?.contact_phone || settings?.contact_address) && (
            <div className="text-sm opacity-80 flex flex-col gap-1">
              {settings.contact_phone && <span>📞 {settings.contact_phone}</span>}
              {settings.contact_address && <span>📍 {settings.contact_address}</span>}
            </div>
          )}
          <p className="site-footer-copy">
            © {new Date().getFullYear()} {settings?.radio_name || "TOP100 FM"} — Todos os direitos reservados.
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          {socialLinks.length > 0 && (
            <div className="flex gap-3">
              {socialLinks.map((link: any, i: number) => (
                <a key={i} href={link.url} target="_blank" rel="noreferrer" className="text-foreground/80 hover:text-foreground transition-colors" title={link.name}>
                  {link.name}
                </a>
              ))}
            </div>
          )}
          
          <Link
            to="/admin/login"
            className="site-footer-admin"
            aria-label="Acesso restrito da equipe"
            title="Equipe"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2 4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
