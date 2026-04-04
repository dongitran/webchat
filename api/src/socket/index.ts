import type { AppServer } from "../config/socket.js";
import { socketAuthMiddleware } from "./auth.socket.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { registerMessageHandlers } from "./handlers/message.handler.js";

export function initializeSocket(io: AppServer): void {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    registerConnectionHandlers(io, socket);
    registerMessageHandlers(io, socket);
  });
}
