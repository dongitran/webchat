import type { Request, Response, NextFunction } from "express";
import type { IUser } from "@webchat/shared";
import { verifyAccessToken } from "../lib/jwt.js";
import { UserModel } from "../models/user.model.js";
import { UnauthorizedError } from "../lib/errors.js";

// Augment Express.User so passport + our IUser are compatible
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required for Express augmentation
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- merging with IUser
    interface User extends IUser {}
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).lean<IUser>();
    if (!user) {
      next(new UnauthorizedError("User not found"));
      return;
    }
    req.user = user;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
