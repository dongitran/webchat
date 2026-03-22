import pino from "pino";
import { env } from "../config/env.js";

const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie"]);

type HeaderRecord = Record<string, string | string[] | undefined>;

function scrubHeaders(headers: HeaderRecord | undefined): HeaderRecord | undefined {
  if (!headers) return headers;
  const scrubbed: HeaderRecord = {};
  for (const [key, value] of Object.entries(headers)) {
    scrubbed[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return scrubbed;
}

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  serializers: {
    req(raw: Record<string, unknown>) {
      return {
        method: raw["method"],
        url: raw["url"],
        headers: scrubHeaders(raw["headers"] as HeaderRecord | undefined),
      };
    },
    res(raw: Record<string, unknown>) {
      return { statusCode: raw["statusCode"] };
    },
    err: pino.stdSerializers.err,
  },
});
