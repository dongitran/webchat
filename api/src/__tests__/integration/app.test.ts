import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("../../config/env.js", () => ({
  env: {
    PORT: 3001,
    NODE_ENV: "test",
    WEB_URL: "http://localhost:5173",
    RATE_LIMIT_WINDOW_MS: 900_000,
    RATE_LIMIT_MAX: 300,
    LOG_LEVEL: "silent",
  },
}));

vi.mock("../../lib/logger.js", async () => {
  const pino = await import("pino");
  return { logger: pino.default({ level: "silent" }) };
});

vi.mock("mongoose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongoose")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: { readyState: 1 },
    },
  };
});

vi.mock("../../config/redis.js", () => ({
  redis: { status: "ready" },
  connectRedis: vi.fn(),
  disconnectRedis: vi.fn(),
}));

// Prevent passport-google-oauth20 from requiring real OAuth credentials in tests
vi.mock("../../config/passport.js", () => ({
  passport: { authenticate: vi.fn(), use: vi.fn() },
}));

import supertest from "supertest";
import { createApp } from "../../app.js";

const app = createApp();
let request: ReturnType<typeof supertest>;

beforeAll(() => {
  request = supertest(app);
});

describe("GET /api/v1/health", () => {
  it("returns 200 with status ok when services are healthy", async () => {
    const response = await request.get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/v1/health/details", () => {
  it("returns detailed health info", async () => {
    const response = await request.get("/api/v1/health/details");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      mongo: "connected",
      redis: "connected",
    });
    expect(response.body.uptime).toBeTypeOf("number");
  });
});

describe("CORS", () => {
  it("includes CORS headers for allowed origin", async () => {
    const response = await request
      .options("/api/v1/health")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("sets allowed origin to configured WEB_URL only", async () => {
    const response = await request
      .options("/api/v1/health")
      .set("Origin", "https://evil.com")
      .set("Access-Control-Request-Method", "GET");

    // cors with a string origin always reflects that string — browser enforces the check
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });
});

describe("Security headers", () => {
  it("includes Helmet security headers", async () => {
    const response = await request.get("/api/v1/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});

describe("404 handler", () => {
  it("returns 404 JSON for unknown routes", async () => {
    const response = await request.get("/api/v1/nonexistent");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: "Route not found",
      code: "NOT_FOUND",
    });
  });
});

describe("Request ID", () => {
  it("generates X-Request-Id when not provided", async () => {
    const response = await request.get("/api/v1/health");

    expect(response.headers["x-request-id"]).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
    );
  });

  it("passes through provided X-Request-Id", async () => {
    const response = await request.get("/api/v1/health").set("X-Request-Id", "custom-request-id");

    expect(response.headers["x-request-id"]).toBe("custom-request-id");
  });
});
