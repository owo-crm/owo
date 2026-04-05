import { beforeEach, describe, expect, it } from "vitest";
import { createAuthToken, verifyAuthToken } from "@/lib/auth/token";

describe("auth/token", () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = "test-secret-abcdefghijklmnopqrstuvwxyz";
    process.env.AUTH_TOKEN_TTL_SECONDS = "3600";
  });

  it("creates and verifies token payload", () => {
    const token = createAuthToken({
      sub: "user_1",
      business_id: "biz_1",
      role: "OWNER",
    });

    const payload = verifyAuthToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user_1");
    expect(payload?.business_id).toBe("biz_1");
    expect(payload?.role).toBe("OWNER");
  });

  it("returns null for tampered token", () => {
    const token = createAuthToken({
      sub: "user_1",
      business_id: "biz_1",
      role: "OWNER",
    });

    const tampered = `${token}a`;
    expect(verifyAuthToken(tampered)).toBeNull();
  });
});

