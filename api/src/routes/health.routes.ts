import { Router, type Router as RouterType } from "express";
import mongoose from "mongoose";
import { redis } from "../config/redis.js";
import type { HealthResponse, HealthDetailResponse } from "@webchat/shared";

const router: RouterType = Router();

router.get("/health", (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === "ready";
  const status = mongoOk && redisOk ? "ok" : "degraded";

  const response: HealthResponse = { status };
  res.status(status === "ok" ? 200 : 503).json(response);
});

router.get("/health/details", (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redis.status === "ready";
  const status = mongoOk && redisOk ? "ok" : "degraded";

  const response: HealthDetailResponse = {
    status,
    uptime: process.uptime(),
    mongo: mongoOk ? "connected" : "disconnected",
    redis: redisOk ? "connected" : "disconnected",
    version: process.env["npm_package_version"] ?? "0.0.0",
  };

  res.status(status === "ok" ? 200 : 503).json(response);
});

export { router as healthRoutes };
