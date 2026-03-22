import { describe, it, expect, vi, beforeEach } from "vitest";
import type { IUser } from "@webchat/shared";

vi.mock("../../../config/env.js", () => ({
  env: {
    JWT_ACCESS_SECRET: "test-access-secret-must-be-at-least-32-chars",
    JWT_REFRESH_SECRET: "test-refresh-secret-must-be-at-least-32-chars",
    NODE_ENV: "test",
  },
}));

// Use vi.hoisted so these are available in the hoisted vi.mock factory
const {
  mockUserFindOne,
  mockUserCreate,
  mockRefreshFindOne,
  mockRefreshCreate,
  mockRefreshUpdateOne,
  mockRefreshUpdateMany,
} = vi.hoisted(() => ({
  mockUserFindOne: vi.fn(),
  mockUserCreate: vi.fn(),
  mockRefreshFindOne: vi.fn(),
  mockRefreshCreate: vi.fn(),
  mockRefreshUpdateOne: vi.fn(),
  mockRefreshUpdateMany: vi.fn(),
}));

vi.mock("../../../models/user.model.js", () => ({
  UserModel: {
    findOne: mockUserFindOne,
    findById: vi.fn(),
    create: mockUserCreate,
  },
}));

vi.mock("../../../models/refresh-token.model.js", () => ({
  RefreshTokenModel: {
    findOne: mockRefreshFindOne,
    create: mockRefreshCreate,
    updateOne: mockRefreshUpdateOne,
    updateMany: mockRefreshUpdateMany,
  },
}));

vi.mock("../../../lib/logger.js", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

import {
  refreshTokens,
  revokeRefreshToken,
  revokeTokenFamily,
  devLogin,
} from "../../../services/auth.service.js";
import { hashToken } from "../../../lib/hash.js";

const testUser: IUser = {
  _id: "user-id-123",
  googleId: "google-123",
  email: "alice@example.com",
  displayName: "Alice",
  avatarUrl: "",
  status: "offline",
  lastSeenAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const testContext = { userAgent: "TestAgent/1.0", ipAddress: "127.0.0.1" };

describe("refreshTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when token is not found", async () => {
    mockRefreshFindOne.mockResolvedValue(null);
    await expect(refreshTokens("invalid-token", testContext)).rejects.toThrow(
      "Invalid refresh token",
    );
  });

  it("throws when token is expired", async () => {
    const expiredDate = new Date(Date.now() - 1000);
    mockRefreshFindOne.mockResolvedValue({ expiresAt: expiredDate, revokedAt: null });
    await expect(refreshTokens("expired-token", testContext)).rejects.toThrow(
      "Refresh token expired",
    );
  });

  it("revokes family and throws on token reuse", async () => {
    mockRefreshFindOne.mockResolvedValue({
      expiresAt: new Date(Date.now() + 100_000),
      revokedAt: new Date(),
      family: "family-1",
    });
    mockRefreshUpdateMany.mockResolvedValue({});

    await expect(refreshTokens("reused-token", testContext)).rejects.toThrow(
      "Token reuse detected",
    );
    expect(mockRefreshUpdateMany).toHaveBeenCalledWith(
      { family: "family-1", revokedAt: null },
      { revokedAt: expect.any(Date) },
    );
  });
});

describe("revokeRefreshToken", () => {
  it("calls updateOne with the token hash", async () => {
    mockRefreshUpdateOne.mockResolvedValue({});
    await revokeRefreshToken("some-hash");
    expect(mockRefreshUpdateOne).toHaveBeenCalledWith(
      { tokenHash: "some-hash", revokedAt: null },
      { revokedAt: expect.any(Date) },
    );
  });
});

describe("revokeTokenFamily", () => {
  it("revokes all tokens in the family", async () => {
    mockRefreshUpdateMany.mockResolvedValue({});
    await revokeTokenFamily("family-abc");
    expect(mockRefreshUpdateMany).toHaveBeenCalledWith(
      { family: "family-abc", revokedAt: null },
      { revokedAt: expect.any(Date) },
    );
  });
});

describe("devLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing user when found", async () => {
    mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve(testUser) });
    mockRefreshCreate.mockResolvedValue({});

    const result = await devLogin("alice@example.com", "Alice", testContext);

    expect(result.user).toEqual(testUser);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("creates a new user when not found", async () => {
    const newUser = { ...testUser, _id: "new-id" };
    mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    mockUserCreate.mockResolvedValue({ toObject: () => newUser });
    mockRefreshCreate.mockResolvedValue({});

    const result = await devLogin("new@example.com", "New User", testContext);

    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com" }),
    );
    expect(result.user._id).toBe("new-id");
  });

  it("stores hashed (not raw) refresh token", async () => {
    mockUserFindOne.mockReturnValue({ lean: () => Promise.resolve(testUser) });
    mockRefreshCreate.mockResolvedValue({});

    const result = await devLogin("alice@example.com", "Alice", testContext);

    const storedHash = mockRefreshCreate.mock.calls[0]?.[0]?.tokenHash as string;
    expect(storedHash).toBe(hashToken(result.refreshToken));
    expect(storedHash).not.toBe(result.refreshToken);
  });
});
