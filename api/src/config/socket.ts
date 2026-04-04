import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "node:http";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@webchat/shared";
import { redis } from "./redis.js";
import { logger } from "../lib/logger.js";

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function createSocketServer(httpServer: HttpServer): AppServer {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",
        credentials: true,
      },
      // Use Redis adapter for multi-instance horizontal scaling
      adapter: undefined, // Set below after pubsub clients are ready
    },
  );

  // Create separate pub/sub Redis clients for the adapter
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.IO Redis adapter initialized");
    })
    .catch((error: unknown) => {
      logger.error({ err: error }, "Failed to initialize Socket.IO Redis adapter");
    });

  return io;
}
