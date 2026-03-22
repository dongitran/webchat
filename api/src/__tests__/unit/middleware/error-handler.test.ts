import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ValidationError, NotFoundError } from "../../../lib/errors.js";

vi.mock("../../../lib/logger.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../../../config/env.js", () => ({
  env: { NODE_ENV: "development" },
}));

import { errorHandlerMiddleware } from "../../../middleware/error-handler.middleware.js";
import { env } from "../../../config/env.js";

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("errorHandlerMiddleware", () => {
  const req = {} as Request;
  const next = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns statusCode and code for AppError", () => {
    const res = createMockRes();
    const error = new NotFoundError("User not found");

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "User not found",
        code: "NOT_FOUND",
      }),
    );
  });

  it("includes details for ValidationError", () => {
    const res = createMockRes();
    const details = { name: { _errors: ["Required"] } };
    const error = new ValidationError("Validation failed", details);

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details,
      }),
    );
  });

  it("returns 500 for unknown errors in development", () => {
    const res = createMockRes();
    const error = new Error("something broke");
    (env as Record<string, unknown>).NODE_ENV = "development";

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("something broke"),
        code: "INTERNAL_ERROR",
      }),
    );
  });

  it("hides error details in production", () => {
    const res = createMockRes();
    const error = new Error("secret internal details");
    (env as Record<string, unknown>).NODE_ENV = "production";

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "An internal error occurred",
      code: "INTERNAL_ERROR",
    });
  });

  it("handles non-Error thrown values", () => {
    const res = createMockRes();
    (env as Record<string, unknown>).NODE_ENV = "development";

    errorHandlerMiddleware("string error", req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "string error",
      code: "INTERNAL_ERROR",
    });
  });
});
