import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Escuta mudanças nas tabelas públicas (Supabase Realtime).
 * Ative em Dashboard → Database → Replication para cada tabela.
 * Retorna função de cleanup.
 */
export function subscribePublicTables(
  supabase: SupabaseClient,
  tables: string[],
  onChange: () => void,
): () => void {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  const channel = supabase.channel(`pub-${id}`);
  for (const table of tables) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => onChange(),
    );
  }
  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
