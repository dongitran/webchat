import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { notFoundMiddleware } from "../../../middleware/not-found.middleware.js";

describe("notFoundMiddleware", () => {
  it("returns 404 with NOT_FOUND code", () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    notFoundMiddleware(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Route not found",
      code: "NOT_FOUND",
    });
  });
});
