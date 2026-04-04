import { Schema, model, type Document } from "mongoose";
import type { ConversationType } from "@webchat/shared";

const CONVERSATION_TYPE = {
  DIRECT: "direct",
  GROUP: "group",
} as const;

interface IConversationDocument extends Document {
  // "type" is renamed to avoid Mongoose keyword conflicts
  conversationType: ConversationType;
  name: string | null;
  dmKey: string | null;
  participants: Schema.Types.ObjectId[];
  lastMessageId: Schema.Types.ObjectId | null;
  sequenceCounter: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversationDocument>(
  {
    conversationType: {
      type: String,
      enum: Object.values(CONVERSATION_TYPE),
      required: true,
    },
    name: { type: String, default: null, maxlength: 100 },
    dmKey: { type: String, default: null },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessageId: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    sequenceCounter: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index(
  { dmKey: 1 },
  {
    unique: true,
    // Only enforce uniqueness when dmKey is set (non-null)
    partialFilterExpression: { dmKey: { $ne: null } },
  },
);

export const ConversationModel = model<IConversationDocument>("Conversation", conversationSchema);
export type { IConversationDocument };
