import { Router, type Router as RouterType } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "./auth.routes.js";

const router: RouterType = Router();

router.use(healthRoutes);
router.use(authRoutes);

export { router as apiRoutes };
