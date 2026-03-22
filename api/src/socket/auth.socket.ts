import type { Socket } from "socket.io";
import { verifyAccessToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";

type NextFunction = (err?: Error) => void;

/**
 * Socket.IO auth middleware — verifies the access token passed via handshake.auth.token.
 * Attaches userId and email to socket.data for downstream handlers.
 */
export function socketAuthMiddleware(socket: Socket, next: NextFunction): void {
  const token = socket.handshake.auth["token"] as string | undefined;

  if (!token) {
    next(new Error("Authentication required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data["userId"] = payload.sub;
    socket.data["email"] = payload.email;
    next();
  } catch (error: unknown) {
    logger.warn({ error }, "Socket auth failed");
    next(new Error("Invalid or expired token"));
  }
}
