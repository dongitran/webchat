import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../../middleware/validate.middleware.js";

function createMocks(overrides: Partial<Request> = {}): {
  req: Request;
  res: Response;
  next: NextFunction;
} {
  const req = {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe("validate middleware", () => {
  const bodySchema = z.object({
    name: z.string().min(1),
    age: z.coerce.number().min(0),
  });

  it("calls next when validation passes", () => {
    const { req, res, next } = createMocks({ body: { name: "Alice", age: 30 } });
    const middleware = validate({ body: bodySchema });

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("replaces req.body with parsed data (coercion applied)", () => {
    const { req, res, next } = createMocks({ body: { name: "Bob", age: "25" } });
    const middleware = validate({ body: bodySchema });

    middleware(req, res, next);

    expect(req.body).toEqual({ name: "Bob", age: 25 });
    expect(next).toHaveBeenCalled();
  });

  it("returns 400 when body validation fails", () => {
    const { req, res, next } = createMocks({ body: { name: "", age: -1 } });
    const middleware = validate({ body: bodySchema });

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed on body",
        code: "VALIDATION_ERROR",
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("validates query params", () => {
    const querySchema = z.object({ page: z.coerce.number().min(1) });
    const { req, res, next } = createMocks({ query: { page: "3" } } as Partial<Request>);
    const middleware = validate({ query: querySchema });

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 400 for invalid query params", () => {
    const querySchema = z.object({ page: z.coerce.number().min(1) });
    const { req, res, next } = createMocks({ query: { page: "0" } } as Partial<Request>);
    const middleware = validate({ query: querySchema });

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Validation failed on query" }),
    );
  });

  it("skips validation for schemas not provided", () => {
    const { req, res, next } = createMocks({ body: { anything: true } });
    const middleware = validate({});

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
