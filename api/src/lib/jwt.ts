import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Algorithm pinned on both sign and verify — prevents alg:none and algorithm confusion attacks
const ALGORITHM = "HS256" as const;
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ["HS256"];

export function signAccessToken(userId: string, email: string): string {
  const payload: Omit<AccessTokenPayload, "iat" | "exp"> = { sub: userId, email };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: "15m",
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  // algorithms array MUST be specified — without it, jwt.verify accepts alg:none
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ALLOWED_ALGORITHMS,
  });
  return payload as AccessTokenPayload;
}
