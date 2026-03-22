import { randomUUID } from "node:crypto";
import type { Profile } from "passport-google-oauth20";
import type { IUser } from "@webchat/shared";
import { UserModel } from "../models/user.model.js";
import { RefreshTokenModel } from "../models/refresh-token.model.js";
import { signAccessToken } from "../lib/jwt.js";
import { hashToken } from "../lib/hash.js";
import { UnauthorizedError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

const REFRESH_TOKEN_TTL_DAYS = 7;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshContext {
  userAgent: string;
  ipAddress: string;
}

function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_TTL_DAYS);
  return expiry;
}

/** Called from Passport strategy — finds or creates the user, returns the IUser record. */
export async function findOrCreateGoogleUser(profile: Profile): Promise<IUser> {
  const email = profile.emails?.[0]?.value;
  if (!email) throw new UnauthorizedError("Google profile missing email");

  const avatarUrl = profile.photos?.[0]?.value ?? "";
  const displayName = profile.displayName ?? email.split("@")[0] ?? "User";

  const existing = await UserModel.findOne({ googleId: profile.id }).lean<IUser>();
  if (existing) return existing;

  const created = await UserModel.create({ googleId: profile.id, email, displayName, avatarUrl });
  return created.toObject() as unknown as IUser;
}

/** Called from the route handler after Passport sets req.user — issues a new token pair. */
export async function issueTokensForUser(user: IUser, context: RefreshContext): Promise<TokenPair> {
  return generateTokenPair(user._id, user.email, randomUUID(), context);
}

export async function refreshTokens(
  oldRefreshToken: string,
  context: RefreshContext,
): Promise<TokenPair> {
  const tokenHash = hashToken(oldRefreshToken);
  const stored = await RefreshTokenModel.findOne({ tokenHash });

  if (!stored) throw new UnauthorizedError("Invalid refresh token");
  if (new Date() > stored.expiresAt) throw new UnauthorizedError("Refresh token expired");

  if (stored.revokedAt !== null) {
    // Token reuse detected — revoke the entire family to protect the legitimate user
    logger.warn({ family: stored.family }, "Refresh token reuse detected — revoking family");
    await revokeTokenFamily(stored.family);
    throw new UnauthorizedError("Token reuse detected");
  }

  const user = await UserModel.findById(stored.userId).lean<IUser>();
  if (!user) throw new UnauthorizedError("User not found");

  const { accessToken, refreshToken } = await generateTokenPair(
    user._id,
    user.email,
    stored.family,
    context,
  );

  // Mark old token as revoked, point to replacement
  stored.revokedAt = new Date();
  stored.replacedByHash = hashToken(refreshToken);
  await stored.save();

  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await RefreshTokenModel.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
}

export async function revokeTokenFamily(family: string): Promise<void> {
  await RefreshTokenModel.updateMany({ family, revokedAt: null }, { revokedAt: new Date() });
}

/** DEV ONLY — find or create user by email, return token pair. */
export async function devLogin(
  email: string,
  displayName: string,
  context: RefreshContext,
): Promise<AuthResult> {
  let user = await UserModel.findOne({ email }).lean<IUser>();

  if (!user) {
    const created = await UserModel.create({
      googleId: `dev_${email}`,
      email,
      displayName,
      avatarUrl: "",
    });
    user = created.toObject() as unknown as IUser;
  }

  const { accessToken, refreshToken } = await generateTokenPair(
    user._id,
    email,
    randomUUID(),
    context,
  );

  return { user, accessToken, refreshToken };
}

async function generateTokenPair(
  userId: string,
  email: string,
  family: string,
  context: RefreshContext,
): Promise<TokenPair> {
  const accessToken = signAccessToken(userId, email);
  const refreshToken = randomUUID();
  const tokenHash = hashToken(refreshToken);

  await RefreshTokenModel.create({
    userId,
    tokenHash,
    family,
    expiresAt: getRefreshTokenExpiry(),
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
  });

  return { accessToken, refreshToken };
}
