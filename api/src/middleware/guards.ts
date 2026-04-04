import type { FilterQuery } from "mongoose";
import { ForbiddenError, NotFoundError } from "../lib/errors.js";
import {
  ConversationMemberModel,
  type IConversationMemberDocument,
} from "../models/conversation-member.model.js";
import { MessageModel, type IMessageDocument } from "../models/message.model.js";

/**
 * Assert that the given user is an active member of the conversation.
 * Throws ForbiddenError if not a member.
 */
export async function assertMembership(userId: string, conversationId: string): Promise<void> {
  const filter: FilterQuery<IConversationMemberDocument> = {
    conversationId,
    userId,
    leftAt: null,
  };
  const member = await ConversationMemberModel.findOne(filter).lean();
  if (!member) {
    throw new ForbiddenError("You are not a member of this conversation");
  }
}

/**
 * Assert that the given user is the sender of the message.
 * Throws NotFoundError if message not found, ForbiddenError if not the owner.
 */
export async function assertMessageOwner(userId: string, messageId: string): Promise<void> {
  const filter: FilterQuery<IMessageDocument> = { _id: messageId };
  const message = await MessageModel.findOne(filter).lean();
  if (!message) {
    throw new NotFoundError("Message not found");
  }
  if (String(message.senderId) !== userId) {
    throw new ForbiddenError("You can only modify your own messages");
  }
}
