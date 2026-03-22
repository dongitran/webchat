import { createHash } from "node:crypto";

/** SHA-256 hash of a token string. Used to store refresh tokens without saving the raw value. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
