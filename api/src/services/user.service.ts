import type { IUser, UserStatus } from "@webchat/shared";
import { NotFoundError } from "../lib/errors.js";
import { UserModel } from "../models/user.model.js";

function toIUser(doc: Record<string, unknown>): IUser {
  return {
    _id: String(doc._id),
    googleId: doc.googleId as string,
    email: doc.email as string,
    displayName: doc.displayName as string,
    avatarUrl: (doc.avatarUrl as string) ?? "",
    status: doc.status as UserStatus,
    lastSeenAt: doc.lastSeenAt as Date,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export async function getUserById(userId: string): Promise<IUser> {
  const doc = await UserModel.findById(userId).lean<Record<string, unknown>>();
  if (!doc) throw new NotFoundError("User not found");
  return toIUser(doc);
}

export async function searchUsers(query: string, limit: number): Promise<IUser[]> {
  // Text search on displayName index; fallback to email prefix if no text match
  const docs = await UserModel.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean<Record<string, unknown>[]>();

  if (docs.length === 0) {
    // Regex prefix fallback for partial name/email
    const fallback = await UserModel.find({
      $or: [
        { displayName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .limit(limit)
      .lean<Record<string, unknown>[]>();
    return fallback.map((doc) => toIUser(doc));
  }

  return docs.map((doc) => toIUser(doc));
}

export async function updateUserStatus(userId: string, status: UserStatus): Promise<IUser> {
  const doc = await UserModel.findByIdAndUpdate(userId, { $set: { status } }, { new: true }).lean<
    Record<string, unknown>
  >();
  if (!doc) throw new NotFoundError("User not found");
  return toIUser(doc);
}

export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; avatarUrl?: string },
): Promise<IUser> {
  const doc = await UserModel.findByIdAndUpdate(userId, { $set: updates }, { new: true }).lean<
    Record<string, unknown>
  >();
  if (!doc) throw new NotFoundError("User not found");
  return toIUser(doc);
}
