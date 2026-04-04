import { z } from "zod";
import { LIMITS } from "../constants/limits.js";

const mongoIdSchema = z.string().length(24, "Must be a valid 24-character MongoDB ObjectId");

export const CreateConversationSchema = z.object({
  type: z.enum(["direct", "group"]),
  participantIds: z
    .array(mongoIdSchema)
    .min(1, "At least one participant required")
    .max(99, "Maximum 99 participants"),
  name: z.string().min(1).max(LIMITS.CONVERSATION_NAME_MAX_LENGTH).optional(),
});

export const UpdateConversationSchema = z.object({
  name: z.string().min(1).max(LIMITS.CONVERSATION_NAME_MAX_LENGTH),
});

export const ListConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIMITS.CONVERSATIONS_MAX_PER_PAGE)
    .default(LIMITS.CONVERSATIONS_PER_PAGE),
});

export const ConversationParamsSchema = z.object({
  id: mongoIdSchema,
});
