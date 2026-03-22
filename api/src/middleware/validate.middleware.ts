import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

interface ValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const [key, zodSchema] of Object.entries(schema)) {
      if (!zodSchema) continue;
      const target = req[key as keyof typeof req];
      const result = zodSchema.safeParse(target);
      if (!result.success) {
        res.status(400).json({
          error: `Validation failed on ${key}`,
          code: "VALIDATION_ERROR",
          details: result.error.format(),
        });
        return;
      }
      // Replace with parsed (and transformed/coerced) data
      (req as unknown as Record<string, unknown>)[key] = result.data;
    }
    next();
  };
}
