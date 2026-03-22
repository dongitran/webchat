import { randomBytes } from "node:crypto";
import {
  Router,
  type Router as RouterType,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { passport } from "../config/passport.js";
import { env } from "../config/env.js";
import { authLimiter } from "../middleware/rate-limit.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  refreshTokens,
  revokeRefreshToken,
  devLogin,
  issueTokensForUser,
} from "../services/auth.service.js";
import type { IUser } from "@webchat/shared";
import { hashToken } from "../lib/hash.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../lib/errors.js";

const router: RouterType = Router();

const OAUTH_STATE_COOKIE = "oauth_state";
const REFRESH_TOKEN_COOKIE = "refreshToken";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getRefreshCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure,
    path: "/api/v1/auth",
    maxAge: COOKIE_MAX_AGE_MS,
  };
}

// GET /auth/google — initiate OAuth, set CSRF state cookie
router.get("/auth/google", authLimiter, (req: Request, res: Response) => {
  const redirectUri = req.query["redirect_uri"] as string | undefined;
  const allowedUris = env.ALLOWED_REDIRECT_URIS.split(",").map((u) => u.trim());

  if (redirectUri && !allowedUris.includes(redirectUri)) {
    throw new ValidationError("Invalid redirect_uri");
  }

  const state = randomBytes(32).toString("hex");
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000, // 10 min
  });

  const handler = passport.authenticate("google", {
    scope: ["profile", "email"],
    state,
    session: false,
  }) as (req: Request, res: Response, next: NextFunction) => void;

  handler(req, res, () => {});
});

// GET /auth/google/callback — validate CSRF state, complete OAuth, set refresh cookie
router.get(
  "/auth/google/callback",
  authLimiter,
  (req: Request, res: Response, next: NextFunction): void => {
    const queryState = req.query["state"];
    const cookieState = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;

    if (!queryState || !cookieState || queryState !== cookieState) {
      res.clearCookie(OAUTH_STATE_COOKIE);
      next(new ForbiddenError("OAuth state mismatch — possible CSRF"));
      return;
    }

    res.clearCookie(OAUTH_STATE_COOKIE);

    const handler = passport.authenticate(
      "google",
      { session: false, failWithError: true },
      async (err: unknown, user: IUser | undefined) => {
        if (err !== null && err !== undefined) {
          next(err);
          return;
        }
        if (!user) {
          next(new ForbiddenError("OAuth authentication failed"));
          return;
        }

        try {
          const userAgent = (req.headers["user-agent"] as string | undefined) ?? "";
          const ipAddress = req.ip ?? "";
          const { refreshToken } = await issueTokensForUser(user, { userAgent, ipAddress });

          const isSecure = env.NODE_ENV === "production";
          res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions(isSecure));

          const redirectUri = req.query["redirect_uri"] as string | undefined;
          const allowedUris = env.ALLOWED_REDIRECT_URIS.split(",").map((u) => u.trim());
          const destination =
            redirectUri && allowedUris.includes(redirectUri) ? redirectUri : env.WEB_URL;

          res.redirect(destination);
        } catch (tokenError: unknown) {
          next(tokenError);
        }
      },
    ) as (req: Request, res: Response, next: NextFunction) => void;

    handler(req, res, next);
  },
);

// POST /auth/refresh — rotate refresh token, return new access token
router.post("/auth/refresh", authLimiter, async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "No refresh token", code: "UNAUTHORIZED" });
    return;
  }

  const userAgent = (req.headers["user-agent"] as string | undefined) ?? "";
  const ipAddress = req.ip ?? "";
  const { accessToken, refreshToken } = await refreshTokens(token, { userAgent, ipAddress });

  const isSecure = env.NODE_ENV === "production";
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions(isSecure));
  res.json({ accessToken });
});

// POST /auth/logout — revoke refresh token, clear cookie
router.post("/auth/logout", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
  if (token) {
    await revokeRefreshToken(hashToken(token));
  }
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/v1/auth" });
  res.status(204).send();
});

// GET /auth/me — return authenticated user profile
router.get("/auth/me", requireAuth, (_req: Request, res: Response): void => {
  res.json({ user: _req.user });
});

// POST /auth/dev-login — DEV ONLY: create/find user and return tokens
router.post("/auth/dev-login", authLimiter, async (req: Request, res: Response): Promise<void> => {
  if (env.NODE_ENV !== "development") {
    throw new NotFoundError();
  }

  const { email, displayName } = req.body as { email?: unknown; displayName?: unknown };
  if (typeof email !== "string" || !email.includes("@")) {
    throw new ValidationError("email is required");
  }
  const name = typeof displayName === "string" && displayName.length > 0 ? displayName : email;

  const userAgent = (req.headers["user-agent"] as string | undefined) ?? "";
  const ipAddress = req.ip ?? "";
  const { user, accessToken, refreshToken } = await devLogin(email, name, {
    userAgent,
    ipAddress,
  });

  const isSecure = false; // dev only
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions(isSecure));
  res.json({ user, accessToken });
});

export { router as authRoutes };
