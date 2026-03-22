import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { IUser } from "@webchat/shared";
import { env } from "./env.js";
import { findOrCreateGoogleUser } from "../services/auth.service.js";
import { logger } from "../lib/logger.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user: IUser = await findOrCreateGoogleUser(profile);
        done(null, user);
      } catch (error: unknown) {
        logger.error({ error }, "Google OAuth strategy failed");
        done(error instanceof Error ? error : new Error(String(error)));
      }
    },
  ),
);

// Must export the configured instance, not re-export from the module directly
// eslint-disable-next-line unicorn/prefer-export-from -- cannot re-export before strategy is configured
export { passport };
