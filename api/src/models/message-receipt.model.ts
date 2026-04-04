import { Schema, model, type Document } from "mongoose";
import type { ReceiptStatus } from "@webchat/shared";

const RECEIPT_STATUS = {
  DELIVERED: "delivered",
  READ: "read",
} as const;

interface IMessageReceiptDocument extends Document {
  messageId: Schema.Types.ObjectId;
  conversationId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  status: ReceiptStatus;
  deliveredAt: Date | null;
  readAt: Date | null;
}

const messageReceiptSchema = new Schema<IMessageReceiptDocument>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(RECEIPT_STATUS),
      required: true,
    },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: false }, // Use deliveredAt/readAt instead of createdAt/updatedAt
);

// One receipt per message per recipient
messageReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });
// Unread count queries per conversation per user
messageReceiptSchema.index({ conversationId: 1, userId: 1, status: 1 });
// "Read by N" display for a message
messageReceiptSchema.index({ messageId: 1, status: 1 });

export const MessageReceiptModel = model<IMessageReceiptDocument>(
  "MessageReceipt",
  messageReceiptSchema,
);
export type { IMessageReceiptDocument };
