import { Schema, model, type Document, type Types } from "mongoose";

export interface IRefreshTokenDocument extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByHash: string | null;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ family: 1 });
// TTL index — MongoDB auto-deletes documents once expiresAt is reached
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<IRefreshTokenDocument>("RefreshToken", refreshTokenSchema);
