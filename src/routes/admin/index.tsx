import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminLogout, checkAdminSession, ADMIN_SESSION_KEY, ADMIN_PRESENCE_KEY } from "@/lib/admin-auth";
import { AdminSidebar, type AdminTab } from "@/components/admin/AdminSidebar";
import { PromotionsManager } from "@/components/admin/PromotionsManager";
import { EntriesManager } from "@/components/admin/EntriesManager";
import { NewsManager } from "@/components/admin/NewsManager";
import { ProgramacaoManager } from "@/components/admin/ProgramacaoManager";
import { PodcastsManager } from "@/components/admin/PodcastsManager";
import { SponsorsManager } from "@/components/admin/SponsorsManager";
import { UsersManager } from "@/components/admin/UsersManager";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Painel · TOP100 FM" }],
  }),
  component: WrappedAdminDashboard,
});

function clearAdminClientSession() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    document.cookie = `${ADMIN_PRESENCE_KEY}=; Max-Age=0; path=/; SameSite=Lax`;
  } catch {}
}

function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("promos");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      try {
        const session = await checkAdminSession();
        if (!active) return;

        if (session?.authenticated) {
          setIsAuthorized(true);
          return;
        }
      } catch {
      }

      if (!active) return;
      clearAdminClientSession();
      window.location.replace("/admin/login");
    };

    void validateSession().finally(() => {
      if (active) setIsCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } finally {
      clearAdminClientSession();
      window.location.replace("/admin/login");
    }
  };

  if (isCheckingSession || !isAuthorized) {
    return (
      <div className="admin-layout" style={{ minHeight: "100vh", placeItems: "center" }}>
        <main className="admin-main" style={{ display: "grid", placeItems: "center" }}>
          <p className="admin-hint">Carregando painel…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar tab={tab} onChange={setTab} onLogout={handleLogout} />
      <main className="admin-main">
        {tab === "promos" && <PromotionsManager />}
        {tab === "entries" && <EntriesManager />}
        {tab === "news" && <NewsManager />}
        {tab === "programacao" && <ProgramacaoManager />}
        {tab === "podcasts" && <PodcastsManager />}
        {tab === "sponsors" && <SponsorsManager />}
        {tab === "users" && <UsersManager />}
      </main>
    </div>
  );
}

function WrappedAdminDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDashboard />
    </QueryClientProvider>
  );
}

