import { Router, type Router as RouterType } from "express";
import { healthRoutes } from "./health.routes.js";

const router: RouterType = Router();

router.use(healthRoutes);

export { router as apiRoutes };
