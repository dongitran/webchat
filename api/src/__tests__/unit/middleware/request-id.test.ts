import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requestIdMiddleware } from "../../../middleware/request-id.middleware.js";

describe("requestIdMiddleware", () => {
  it("generates a UUID when X-Request-Id is not present", () => {
    const req = { headers: {} } as Request;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requestIdMiddleware(req, res, next);

    expect(req.headers["x-request-id"]).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
    );
    expect(setHeader).toHaveBeenCalledWith("X-Request-Id", req.headers["x-request-id"]);
    expect(next).toHaveBeenCalled();
  });

  it("preserves existing X-Request-Id header", () => {
    const req = { headers: { "x-request-id": "existing-id-123" } } as unknown as Request;
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requestIdMiddleware(req, res, next);

    expect(req.headers["x-request-id"]).toBe("existing-id-123");
    expect(setHeader).toHaveBeenCalledWith("X-Request-Id", "existing-id-123");
    expect(next).toHaveBeenCalled();
  });
});
