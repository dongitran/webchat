import { Schema, model, type Document } from "mongoose";
import type { IUser, UserStatus } from "@webchat/shared";

const USER_STATUS = {
  ONLINE: "online",
  IDLE: "idle",
  DND: "dnd",
  OFFLINE: "offline",
} as const;

// Document shape: IUser minus the _id (Mongoose adds ObjectId _id automatically)
type IUserDocument = Omit<IUser, "_id"> & Document;

const userSchema = new Schema<IUserDocument>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    displayName: { type: String, required: true, maxlength: 100 },
    avatarUrl: {
      type: String,
      default: "",
      validate: {
        validator: (v: string) => v === "" || /^https:\/\/.+/u.test(v),
        message: "avatarUrl must be an HTTPS URL or empty string",
      },
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS) as UserStatus[],
      default: USER_STATUS.OFFLINE,
    },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Compound index for email lookups
userSchema.index({ email: 1 });
// Text index for user search by displayName
userSchema.index({ displayName: "text" });

export const UserModel = model<IUserDocument>("User", userSchema);
