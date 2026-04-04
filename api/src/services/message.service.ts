import type { IMessage, ContentType } from "@webchat/shared";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";
import { ConversationModel } from "../models/conversation.model.js";
import { MessageModel } from "../models/message.model.js";
import { ConversationMemberModel } from "../models/conversation-member.model.js";
import { MessageReceiptModel } from "../models/message-receipt.model.js";
import { assertMembership, assertMessageOwner } from "../middleware/guards.js";
import { LIMITS } from "@webchat/shared";

// Strip HTML tags to prevent stored XSS in message content
function sanitizeContent(content: string): string {
  return content.replaceAll(/<[a-zA-Z/][^>]{0,2000}>/gu, "");
}

function docToIMessage(doc: Record<string, unknown>): IMessage {
  const reactions = (doc.reactions as Array<{ emoji: string; userId: unknown }> | undefined) ?? [];
  return {
    _id: String(doc._id),
    conversationId: String(doc.conversationId),
    senderId: String(doc.senderId),
    clientMessageId: doc.clientMessageId as string,
    sequenceNumber: doc.sequenceNumber as number,
    content: doc.content as string,
    contentType: (doc.contentType as ContentType) ?? "text",
    replyTo: doc.replyTo ? String(doc.replyTo) : null,
    reactions: reactions.map((r) => ({ emoji: r.emoji, userId: String(r.userId) })),
    editedAt: (doc.editedAt as Date | null) ?? null,
    deletedAt: (doc.deletedAt as Date | null) ?? null,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export async function sendMessage(
  senderId: string,
  conversationId: string,
  data: {
    clientMessageId: string;
    content: string;
    contentType?: ContentType;
    replyTo?: string;
  },
): Promise<IMessage> {
  await assertMembership(senderId, conversationId);

  const sanitized = sanitizeContent(data.content);

  // Atomically increment sequenceCounter and get the new value
  const updated = await ConversationModel.findByIdAndUpdate(
    conversationId,
    { $inc: { sequenceCounter: 1 } },
    { new: true, select: "sequenceCounter" },
  ).lean<{ sequenceCounter: number }>();

  if (!updated) throw new NotFoundError("Conversation not found");

  // Idempotent upsert: same clientMessageId in same conversation → same message
  const message = await MessageModel.findOneAndUpdate(
    { conversationId, clientMessageId: data.clientMessageId },
    {
      $setOnInsert: {
        conversationId,
        senderId,
        clientMessageId: data.clientMessageId,
        sequenceNumber: updated.sequenceCounter,
        content: sanitized,
        contentType: data.contentType ?? "text",
        replyTo: data.replyTo ?? null,
        reactions: [],
        editedAt: null,
        deletedAt: null,
      },
    },
    { upsert: true, new: true },
  ).lean<Record<string, unknown>>();

  if (!message) throw new NotFoundError("Message creation failed");

  // Update conversation's lastMessageId
  await ConversationModel.findByIdAndUpdate(conversationId, {
    $set: { lastMessageId: message._id },
  });

  // Increment unread counts for all members except sender
  await ConversationMemberModel.updateMany(
    { conversationId, userId: { $ne: senderId }, leftAt: null },
    { $inc: { unreadCount: 1 } },
  );

  // Create delivered receipt for sender (they already "have" the message)
  await MessageReceiptModel.updateOne(
    { messageId: message._id, userId: senderId },
    {
      $set: {
        conversationId,
        status: "read",
        deliveredAt: new Date(),
        readAt: new Date(),
      },
    },
    { upsert: true },
  );

  return docToIMessage(message);
}

export async function listMessages(
  userId: string,
  conversationId: string,
  before: string | undefined,
  limit: number,
): Promise<{ messages: IMessage[]; hasMore: boolean }> {
  await assertMembership(userId, conversationId);

  let sequenceCondition: Record<string, unknown> = {};
  if (before) {
    const cursor = await MessageModel.findById(before).lean<{ sequenceNumber: number }>();
    if (cursor) {
      sequenceCondition = { sequenceNumber: { $lt: cursor.sequenceNumber } };
    }
  }

  const messages = await MessageModel.find({
    conversationId,
    deletedAt: null,
    ...sequenceCondition,
  })
    .sort({ sequenceNumber: -1 })
    .limit(limit + 1)
    .lean<Record<string, unknown>[]>();

  const hasMore = messages.length > limit;
  const page = messages.slice(0, limit).toReversed();

  return { messages: page.map((doc) => docToIMessage(doc)), hasMore };
}

export async function editMessage(
  userId: string,
  messageId: string,
  content: string,
): Promise<IMessage> {
  await assertMessageOwner(userId, messageId);

  const sanitized = sanitizeContent(content);

  const message = await MessageModel.findOneAndUpdate(
    { _id: messageId, deletedAt: null },
    { $set: { content: sanitized, editedAt: new Date() } },
    { new: true },
  ).lean<Record<string, unknown>>();

  if (!message) throw new NotFoundError("Message not found or already deleted");
  return docToIMessage(message);
}

export async function deleteMessage(userId: string, messageId: string): Promise<void> {
  await assertMessageOwner(userId, messageId);

  const result = await MessageModel.findOneAndUpdate(
    { _id: messageId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
  );

  if (!result) throw new NotFoundError("Message not found or already deleted");
}

export async function addReaction(
  userId: string,
  messageId: string,
  emoji: string,
): Promise<IMessage> {
  const message = await MessageModel.findById(messageId).lean<Record<string, unknown>>();
  if (!message) throw new NotFoundError("Message not found");
  if (message.deletedAt) throw new NotFoundError("Message has been deleted");

  await assertMembership(userId, String(message.conversationId));

  const reactions = (message.reactions as Array<{ emoji: string; userId: unknown }>) ?? [];

  // Enforce: 1 reaction per emoji per user
  const alreadyReacted = reactions.some((r) => r.emoji === emoji && String(r.userId) === userId);
  if (alreadyReacted) throw new ForbiddenError("You already reacted with this emoji");

  // Cap total reactions at 50
  if (reactions.length >= LIMITS.REACTIONS_MAX_PER_MESSAGE) {
    throw new ForbiddenError("Maximum reactions reached for this message");
  }

  const updated = await MessageModel.findByIdAndUpdate(
    messageId,
    { $push: { reactions: { emoji, userId } } },
    { new: true },
  ).lean<Record<string, unknown>>();

  if (!updated) throw new NotFoundError("Message not found");
  return docToIMessage(updated);
}

export async function removeReaction(
  userId: string,
  messageId: string,
  emoji: string,
): Promise<IMessage> {
  const message = await MessageModel.findById(messageId).lean<Record<string, unknown>>();
  if (!message) throw new NotFoundError("Message not found");

  await assertMembership(userId, String(message.conversationId));

  const updated = await MessageModel.findByIdAndUpdate(
    messageId,
    { $pull: { reactions: { emoji, userId } } },
    { new: true },
  ).lean<Record<string, unknown>>();

  if (!updated) throw new NotFoundError("Message not found");
  return docToIMessage(updated);
}

export async function markMessagesRead(
  userId: string,
  conversationId: string,
  messageIds: string[],
): Promise<void> {
  await assertMembership(userId, conversationId);

  const now = new Date();
  await Promise.all(
    messageIds.map((messageId) =>
      MessageReceiptModel.updateOne(
        { messageId, userId },
        {
          $set: {
            conversationId,
            status: "read",
            deliveredAt: now,
            readAt: now,
          },
        },
        { upsert: true },
      ),
    ),
  );

  // Reset unread count for this user
  await ConversationMemberModel.updateOne(
    { conversationId, userId },
    { $set: { unreadCount: 0, lastReadMessageId: messageIds.at(-1) } },
  );
}

export async function markMessageDelivered(
  userId: string,
  messageId: string,
  conversationId: string,
): Promise<void> {
  await assertMembership(userId, conversationId);

  const now = new Date();
  await MessageReceiptModel.updateOne(
    { messageId, userId },
    {
      $setOnInsert: { conversationId },
      $set: { status: "delivered", deliveredAt: now },
    },
    { upsert: true },
  );
}
