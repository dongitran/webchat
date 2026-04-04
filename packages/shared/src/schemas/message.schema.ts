import { z } from "zod";
import { LIMITS } from "../constants/limits.js";

const mongoIdSchema = z.string().length(24, "Must be a valid 24-character MongoDB ObjectId");

// Emoji validation: single presentation emoji or ZWJ sequence
const emojiSchema = z
  .string()
  .regex(/^\p{Emoji_Presentation}(\u200D\p{Emoji_Presentation})*/u, "Invalid emoji");

export const SendMessageSchema = z.object({
  clientMessageId: z.uuid(),
  content: z.string().min(1).max(LIMITS.MESSAGE_MAX_LENGTH),
  contentType: z.enum(["text", "image", "file"]).default("text"),
  replyTo: mongoIdSchema.optional(),
});

export const EditMessageSchema = z.object({
  content: z.string().min(1).max(LIMITS.MESSAGE_MAX_LENGTH),
});

export const AddReactionSchema = z.object({
  emoji: emojiSchema,
});

export const ListMessagesQuerySchema = z.object({
  before: mongoIdSchema.optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIMITS.MESSAGES_MAX_PER_PAGE)
    .default(LIMITS.MESSAGES_PER_PAGE),
});

export const MessageParamsSchema = z.object({
  id: mongoIdSchema,
});

export const MessageReactionParamsSchema = z.object({
  id: mongoIdSchema,
  emoji: emojiSchema,
});

export const ConversationMessageParamsSchema = z.object({
  id: mongoIdSchema,
});
