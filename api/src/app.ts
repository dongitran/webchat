import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { globalLimiter } from "./middleware/rate-limit.middleware.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware.js";
import { apiRoutes } from "./routes/index.js";

export function createApp(): express.Express {
  const app = express();

  // 1. Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "https://lh3.googleusercontent.com"],
          connectSrc: ["'self'", "wss:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
      },
    }),
  );

  // 2. CORS
  app.use(
    cors({
      origin: env.WEB_URL,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // 3. Rate limiter
  app.use(globalLimiter);

  // 4. Body parser
  app.use(express.json({ limit: "1mb" }));

  // 5. Request ID
  app.use(requestIdMiddleware);

  // 6. Request logging
  app.use(pinoHttp({ logger }));

  // 7. Routes
  app.use("/api/v1", apiRoutes);

  // 8. 404 handler
  app.use(notFoundMiddleware);

  // 9. Global error handler
  app.use(errorHandlerMiddleware);

  return app;
}
