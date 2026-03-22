import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err instanceof AppError && "details" in err ? { details: err.details } : {}),
    });
    return;
  }

  // Unexpected error — log full details, return generic message
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    error: env.NODE_ENV === "production" ? "An internal error occurred" : String(err),
    code: "INTERNAL_ERROR",
  });
}
