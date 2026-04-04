import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  SendMessageSchema,
  EditMessageSchema,
  AddReactionSchema,
  ListMessagesQuerySchema,
  MessageParamsSchema,
  MessageReactionParamsSchema,
  ConversationMessageParamsSchema,
} from "@webchat/shared";
import * as messageController from "../controllers/message.controller.js";

const router: RouterType = Router();

// Routes under /conversations/:id/messages (merged in)
router.get(
  "/conversations/:id/messages",
  requireAuth,
  validate({ params: ConversationMessageParamsSchema, query: ListMessagesQuerySchema }),
  messageController.listMessages,
);

router.post(
  "/conversations/:id/messages",
  requireAuth,
  validate({ params: ConversationMessageParamsSchema, body: SendMessageSchema }),
  messageController.sendMessage,
);

// Routes under /messages/:id
router.patch(
  "/messages/:id",
  requireAuth,
  validate({ params: MessageParamsSchema, body: EditMessageSchema }),
  messageController.editMessage,
);

router.delete(
  "/messages/:id",
  requireAuth,
  validate({ params: MessageParamsSchema }),
  messageController.deleteMessage,
);

router.post(
  "/messages/:id/reactions",
  requireAuth,
  validate({ params: MessageParamsSchema, body: AddReactionSchema }),
  messageController.addReaction,
);

router.delete(
  "/messages/:id/reactions/:emoji",
  requireAuth,
  validate({ params: MessageReactionParamsSchema }),
  messageController.removeReaction,
);

export default router;
