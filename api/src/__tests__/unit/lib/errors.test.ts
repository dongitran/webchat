import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
} from "../../../lib/errors.js";

describe("Error classes", () => {
  it("AppError sets statusCode, code, and message", () => {
    const error = new AppError(418, "TEAPOT", "I'm a teapot");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe("TEAPOT");
    expect(error.message).toBe("I'm a teapot");
    expect(error.name).toBe("AppError");
  });

  it("NotFoundError defaults to 404", () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Resource not found");
    expect(error.name).toBe("NotFoundError");
  });

  it("NotFoundError accepts custom message", () => {
    const error = new NotFoundError("User not found");
    expect(error.message).toBe("User not found");
  });

  it("UnauthorizedError defaults to 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.name).toBe("UnauthorizedError");
  });

  it("ForbiddenError defaults to 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.name).toBe("ForbiddenError");
  });

  it("ValidationError defaults to 400 and stores details", () => {
    const details = { field: "email" };
    const error = new ValidationError("Bad input", details);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ field: "email" });
    expect(error.name).toBe("ValidationError");
  });

  it("ConflictError defaults to 409", () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.name).toBe("ConflictError");
  });

  it("RateLimitError defaults to 429", () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error.name).toBe("RateLimitError");
  });

  it("all error classes are instanceof AppError", () => {
    const errors = [
      new NotFoundError(),
      new UnauthorizedError(),
      new ForbiddenError(),
      new ValidationError(),
      new ConflictError(),
      new RateLimitError(),
    ];
    for (const error of errors) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    }
  });
});
