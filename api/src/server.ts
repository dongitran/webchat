import { createServer } from "node:http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { createApp } from "./app.js";

const app = createApp();
const server = createServer(app);

async function start(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "API server started");
  });
}

async function shutdown(): Promise<void> {
  logger.info("Shutting down gracefully...");
  server.close();
  await disconnectDatabase();
  await disconnectRedis();
  logger.info("Shutdown complete");
  process.exit(0); // eslint-disable-line unicorn/no-process-exit -- graceful shutdown must terminate process
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

start().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to start server");
  process.exit(1); // eslint-disable-line unicorn/no-process-exit -- fatal startup failure
});
