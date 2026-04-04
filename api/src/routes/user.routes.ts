import { Router, type Router as RouterType } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  SearchUsersQuerySchema,
  UserParamsSchema,
  UpdateStatusSchema,
  UpdateProfileSchema,
} from "@webchat/shared";
import * as userController from "../controllers/user.controller.js";

const router: RouterType = Router();

router.get(
  "/search",
  requireAuth,
  validate({ query: SearchUsersQuerySchema }),
  userController.searchUsers,
);

router.get("/:id", requireAuth, validate({ params: UserParamsSchema }), userController.getUserById);

router.patch(
  "/me/status",
  requireAuth,
  validate({ body: UpdateStatusSchema }),
  userController.updateMyStatus,
);

router.patch(
  "/me/profile",
  requireAuth,
  validate({ body: UpdateProfileSchema }),
  userController.updateMyProfile,
);

export default router;
