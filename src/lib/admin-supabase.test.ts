import { describe, it, expect } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "./admin-supabase";

describe("hashAdminPassword / verifyAdminPassword", () => {
  it("hash não é igual à senha em texto plano", async () => {
    const hash = await hashAdminPassword("minhasenha123");
    expect(hash).not.toBe("minhasenha123");
    expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
  });

  it("verifica senha correta contra hash", async () => {
    const hash = await hashAdminPassword("senha-correta");
    expect(await verifyAdminPassword("senha-correta", hash)).toBe(true);
  });

  it("rejeita senha errada", async () => {
    const hash = await hashAdminPassword("senha-correta");
    expect(await verifyAdminPassword("senha-errada", hash)).toBe(false);
  });

  it("fallback: hash === plaintext (legado) → aceita", async () => {
    expect(await verifyAdminPassword("legacy_pass", "legacy_pass")).toBe(true);
  });

  it("hash vazio → rejeita sempre", async () => {
    expect(await verifyAdminPassword("qualquer", "")).toBe(false);
  });

  it("dois hashes da mesma senha são diferentes (salt)", async () => {
    const h1 = await hashAdminPassword("mesma-senha");
    const h2 = await hashAdminPassword("mesma-senha");
    expect(h1).not.toBe(h2);
  });
});
