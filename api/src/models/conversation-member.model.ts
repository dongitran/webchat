import { Schema, model, type Document } from "mongoose";

interface IConversationMemberDocument extends Document {
  conversationId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  lastReadMessageId: Schema.Types.ObjectId | null;
  unreadCount: number;
  mutedUntil: Date | null;
  joinedAt: Date;
  leftAt: Date | null;
}

const conversationMemberSchema = new Schema<IConversationMemberDocument>({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lastReadMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  unreadCount: { type: Number, default: 0 },
  mutedUntil: { type: Date, default: null },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date, default: null },
});

// Unique membership — one record per (conversationId, userId)
conversationMemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
// Active memberships for a user
conversationMemberSchema.index({ userId: 1, leftAt: 1 });

export const ConversationMemberModel = model<IConversationMemberDocument>(
  "ConversationMember",
  conversationMemberSchema,
);
export type { IConversationMemberDocument };
