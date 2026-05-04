import { describe, it, expect } from "vitest";
import { createAdminToken, verifyAdminToken } from "./admin-token";

describe("admin-token", () => {
  const secret = "a".repeat(32);

  it("accepts valid non-expired token", async () => {
    const token = await createAdminToken(
      { username: "admin", expiresAt: Date.now() + 60_000 },
      secret,
    );
    expect(await verifyAdminToken(token, secret)).toBe(true);
  });

  it("rejects expired token", async () => {
    const token = await createAdminToken(
      { username: "admin", expiresAt: Date.now() - 1 },
      secret,
    );
    expect(await verifyAdminToken(token, secret)).toBe(false);
  });

  it("rejects tampered token", async () => {
    const token = await createAdminToken(
      { username: "admin", expiresAt: Date.now() + 60_000 },
      secret,
    );
    const tampered = `${token}x`;
    expect(await verifyAdminToken(tampered, secret)).toBe(false);
  });

  it("rejects wrong secret", async () => {
    const token = await createAdminToken(
      { username: "admin", expiresAt: Date.now() + 60_000 },
      secret,
    );
    expect(await verifyAdminToken(token, "b".repeat(32))).toBe(false);
  });
});
