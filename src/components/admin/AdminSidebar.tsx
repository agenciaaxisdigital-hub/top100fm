import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import topLogo from "@/assets/top100-logo.png";
import {
  CalendarIcon,
  ExternalLinkIcon,
  GiftIcon,
  LogoutIcon,
  MicIcon,
  NewsIcon,
  ShieldIcon,
  UsersIcon,
} from "./icons";

export type AdminTab =
  | "promos"
  | "entries"
  | "news"
  | "programacao"
  | "podcasts"
  | "sponsors"
  | "users";

const NAV: { key: AdminTab; label: string; icon: ComponentType }[] = [
  { key: "promos", label: "Promoções", icon: GiftIcon },
  { key: "entries", label: "Base de Inscritos", icon: UsersIcon },
  { key: "news", label: "Notícias", icon: NewsIcon },
  { key: "programacao", label: "Programação", icon: CalendarIcon },
  { key: "podcasts", label: "Podcasts", icon: MicIcon },
  { key: "sponsors", label: "Patrocinadores", icon: GiftIcon },
  { key: "users", label: "Administradores", icon: ShieldIcon },
];

export function AdminSidebar({
  tab,
  onChange,
  onLogout,
}: {
  tab: AdminTab;
  onChange: (tab: AdminTab) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <img src={topLogo} alt="TOP100 FM" className="admin-sidebar-logo-img" />
        <span>Painel administrativo</span>
      </div>
      <nav className="admin-nav">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              className={tab === n.key ? "active" : ""}
              onClick={() => onChange(n.key)}
            >
              <span className="admin-nav-icon">
                <Icon />
              </span>
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="admin-sidebar-footer">
        <Link to="/" className="admin-nav-link">
          <ExternalLinkIcon />
          <span>Ver site público</span>
        </Link>
        <button onClick={onLogout} className="admin-logout-btn">
          <LogoutIcon />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
