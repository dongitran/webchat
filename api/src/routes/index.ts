import { Router, type Router as RouterType } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";

const router: RouterType = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use("/users", userRoutes);
router.use("/conversations", conversationRoutes);
// Message routes use mixed /conversations/:id/messages and /messages/:id paths
router.use(messageRoutes);

export { router as apiRoutes };
