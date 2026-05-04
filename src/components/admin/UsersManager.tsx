import { useState } from "react";
import { createAdminUser } from "@/lib/admin-api";
import { ShieldIcon } from "./icons";

export function UsersManager() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setMsg(null);
    if (!username.trim() || password.length < 8) {
      setMsg({ type: "err", text: "Usuário obrigatório e senha com no mínimo 8 caracteres." });
      return;
    }
    setBusy(true);
    try {
      await createAdminUser({ data: { username: username.trim(), password } });
      setMsg({ type: "ok", text: `Usuário "${username}" criado com sucesso.` });
      setUsername("");
      setPassword("");
    } catch (e) {
      setMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Erro ao criar usuário",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-section">
      <header className="admin-section-header">
        <h1>
          <ShieldIcon /> <span>Administradores</span>
        </h1>
      </header>
      <div className="admin-form-card">
        <h3>Criar novo administrador</h3>
        {msg && <div className={msg.type === "ok" ? "admin-success" : "admin-error"}>{msg.text}</div>}
        <div className="admin-field">
          <label>Nome de usuário</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: locutor.matheus"
            maxLength={60}
            autoComplete="off"
          />
        </div>
        <div className="admin-field">
          <label>Senha (mín. 8 caracteres)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        <div className="admin-form-actions">
          <button className="admin-btn-primary" onClick={create} disabled={busy}>
            {busy ? "Criando..." : "Criar administrador"}
          </button>
        </div>
        <p className="admin-hint">
          Cada administrador tem acesso completo ao painel. Para remover um administrador, use o
          banco de dados Supabase diretamente.
        </p>
      </div>
    </section>
  );
}
