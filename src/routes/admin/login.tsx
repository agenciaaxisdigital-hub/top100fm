import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminLogin, ADMIN_SESSION_KEY } from "@/lib/admin-auth";
import topLogo from "@/assets/top100-logo.png";

const REMEMBER_KEY = "admin_remember";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Entrar — Painel TOP100 FM" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { username?: string };
        if (parsed.username) {
          setUsername(parsed.username);
          setRemember(true);
        }
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const u = username.trim();
    const p = password;

    if (!u || !p) {
      setError("Preencha usuário e senha.");
      return;
    }

    setLoading(true);
    try {
      const result = await adminLogin({ data: { username: u, password: p } });
      if (result.success) {
        try {
          if (result.token) {
            sessionStorage.setItem(ADMIN_SESSION_KEY, result.token);
            localStorage.setItem(ADMIN_SESSION_KEY, result.token);
          }
          if (remember) {
            localStorage.setItem(REMEMBER_KEY, JSON.stringify({ username: u }));
          } else {
            localStorage.removeItem(REMEMBER_KEY);
          }
        } catch {}

        // Mantém overlay de carregamento ativo durante a navegação
        await navigate({ to: "/admin", replace: true });
        return;
      } else {
        setError(result.error || "Não foi possível entrar.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {loading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8, 10, 18, 0.78)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: "4px solid rgba(255,255,255,0.15)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "admin-spin 0.9s linear infinite",
            }}
          />
          <p style={{ color: "#fff", fontWeight: 500, letterSpacing: 0.3 }}>
            Entrando no painel…
          </p>
          <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src={topLogo} alt="TOP100 FM" className="admin-login-logo-img" />
          <h1>Entrar no Painel</h1>
          <p>Rádio TOP100 FM · Administração</p>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form" method="post" action="/admin/login" noValidate>
          {error && <div className="admin-error">{error}</div>}
          <div className="admin-field">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Seu usuário"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="password">Senha</label>
            <div className="admin-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          <label className="admin-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Lembrar meu usuário neste dispositivo</span>
          </label>
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <div className="admin-login-hint">Acesso restrito à equipe TOP100 FM</div>
      </div>
    </div>
  );
}
