import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

vi.mock("../../../config/env.js", () => ({
  env: {
    JWT_ACCESS_SECRET: "test-access-secret-must-be-at-least-32-chars",
    JWT_REFRESH_SECRET: "test-refresh-secret-must-be-at-least-32-chars",
    NODE_ENV: "test",
  },
}));

import { signAccessToken, verifyAccessToken, type AccessTokenPayload } from "../../../lib/jwt.js";

describe("signAccessToken", () => {
  it("returns a valid JWT string", () => {
    const token = signAccessToken("user123", "user@example.com");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("encodes sub and email in the payload", () => {
    const token = signAccessToken("abc", "abc@test.com");
    const decoded = jwt.decode(token) as AccessTokenPayload;
    expect(decoded.sub).toBe("abc");
    expect(decoded.email).toBe("abc@test.com");
  });

  it("uses HS256 algorithm", () => {
    const token = signAccessToken("user123", "user@example.com");
    const header = JSON.parse(Buffer.from(token.split(".")[0] ?? "", "base64url").toString()) as {
      alg: string;
    };
    expect(header.alg).toBe("HS256");
  });
});

describe("verifyAccessToken", () => {
  it("verifies a token signed with the correct secret", () => {
    const token = signAccessToken("user123", "user@example.com");
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user123");
    expect(payload.email).toBe("user@example.com");
  });

  it("throws on a tampered token", () => {
    const token = signAccessToken("user123", "user@example.com");
    const tampered = `${token.slice(0, -5)}xxxxx`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("throws on a token signed with wrong secret", () => {
    // eslint-disable-next-line sonarjs/hardcoded-secret-signatures -- intentional test value, not a real secret
    const token = jwt.sign({ sub: "x", email: "x@x.com" }, "wrong-secret-value");
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("rejects a token with alg:none", () => {
    // Craft a token with alg:none — should be rejected by verify
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "attacker", email: "x@x.com", iat: Date.now() }),
    ).toString("base64url");
    const noneToken = `${header}.${payload}.`;

    expect(() => verifyAccessToken(noneToken)).toThrow();
  });

  it("throws on expired token", () => {
    // Sign a valid token then advance system time past its 15-min expiry
    const token = signAccessToken("user123", "user@example.com");
    vi.setSystemTime(new Date(Date.now() + 16 * 60 * 1000));
    expect(() => verifyAccessToken(token)).toThrow();
    vi.useRealTimers();
  });
});

describe("token uniqueness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("generates different tokens for different users", () => {
    const t1 = signAccessToken("user1", "u1@test.com");
    const t2 = signAccessToken("user2", "u2@test.com");
    expect(t1).not.toBe(t2);
  });
});
