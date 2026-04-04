import { Schema, model, type Document } from "mongoose";
import type { ContentType } from "@webchat/shared";

const CONTENT_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
} as const;

interface IReactionSubdoc {
  emoji: string;
  userId: Schema.Types.ObjectId;
}

interface IMessageDocument extends Document {
  conversationId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  clientMessageId: string;
  sequenceNumber: number;
  content: string;
  contentType: ContentType;
  replyTo: Schema.Types.ObjectId | null;
  reactions: IReactionSubdoc[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientMessageId: {
      type: String,
      required: true,
      // Idempotent upsert key: { conversationId, clientMessageId } is unique
    },
    sequenceNumber: {
      type: Number,
      required: true,
      // Assigned via atomic Conversation.findOneAndUpdate({ $inc: { sequenceCounter: 1 } })
    },
    content: { type: String, required: true, maxlength: 10_000 },
    contentType: {
      type: String,
      enum: Object.values(CONTENT_TYPE),
      default: CONTENT_TYPE.TEXT,
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    reactions: [
      {
        emoji: {
          type: String,
          required: true,
          validate: {
            validator: (v: string) =>
              /^\p{Emoji_Presentation}(\u200D\p{Emoji_Presentation})*/u.test(v),
            message: "Invalid emoji",
          },
        },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Paginated message history (deterministic order by sequence)
messageSchema.index({ conversationId: 1, sequenceNumber: -1 });
// Fallback pagination by timestamp
messageSchema.index({ conversationId: 1, createdAt: -1 });
// Idempotent upsert — one message per (conversationId, clientMessageId)
messageSchema.index({ conversationId: 1, clientMessageId: 1 }, { unique: true });
// Messages by sender in a conversation
messageSchema.index({ conversationId: 1, senderId: 1 });
// Filter soft-deleted messages
messageSchema.index({ deletedAt: 1 });

export const MessageModel = model<IMessageDocument>("Message", messageSchema);
export type { IMessageDocument };
