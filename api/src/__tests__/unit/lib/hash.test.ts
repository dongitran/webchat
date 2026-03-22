import { describe, it, expect } from "vitest";
import { hashToken } from "../../../lib/hash.js";

describe("hashToken", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const result = hashToken("some-token");
    expect(result).toMatch(/^[\da-f]{64}$/);
  });

  it("is deterministic — same input gives same output", () => {
    const token = "my-refresh-token-value";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("is not reversible — output differs from input", () => {
    const token = "raw-token";
    expect(hashToken(token)).not.toBe(token);
  });
});
