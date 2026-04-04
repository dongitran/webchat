import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  CreateConversationSchema,
  UpdateConversationSchema,
  ListConversationsQuerySchema,
  ConversationParamsSchema,
} from "@webchat/shared";
import * as conversationController from "../controllers/conversation.controller.js";

const router: RouterType = Router();

router.get(
  "/",
  requireAuth,
  validate({ query: ListConversationsQuerySchema }),
  conversationController.listConversations,
);

router.post(
  "/",
  requireAuth,
  validate({ body: CreateConversationSchema }),
  conversationController.createConversation,
);

router.get(
  "/:id",
  requireAuth,
  validate({ params: ConversationParamsSchema }),
  conversationController.getConversation,
);

router.patch(
  "/:id",
  requireAuth,
  validate({ params: ConversationParamsSchema, body: UpdateConversationSchema }),
  conversationController.updateConversation,
);

router.delete(
  "/:id/leave",
  requireAuth,
  validate({ params: ConversationParamsSchema }),
  conversationController.leaveConversation,
);

router.get(
  "/:id/members",
  requireAuth,
  validate({ params: ConversationParamsSchema }),
  conversationController.getConversationMembers,
);

export default router;
