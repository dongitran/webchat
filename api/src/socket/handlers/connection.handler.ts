import type { AppServer } from "../../config/socket.js";
import type { Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@webchat/shared";
import { ConversationMemberModel } from "../../models/conversation-member.model.js";
import { UserModel } from "../../models/user.model.js";
import { assertMembership } from "../../middleware/guards.js";
import { logger } from "../../lib/logger.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerConnectionHandlers(io: AppServer, socket: AppSocket): void {
  const userId = socket.data.userId;

  void (async () => {
    // Set user online and emit presence
    await UserModel.findByIdAndUpdate(userId, { $set: { status: "online" } });
    io.emit("presence_changed", {
      userId,
      status: "online",
      lastSeenAt: new Date(),
    });

    // Auto-join all active conversation rooms
    const memberships = await ConversationMemberModel.find({
      userId,
      leftAt: null,
    }).lean<Array<{ conversationId: unknown }>>();

    for (const m of memberships) {
      await socket.join(String(m.conversationId));
    }

    logger.info({ userId, rooms: memberships.length }, "Socket connected");
  })();

  socket.on("join_room", ({ conversationId }) => {
    void (async () => {
      try {
        await assertMembership(userId, conversationId);
        await socket.join(conversationId);
      } catch {
        socket.emit("error", { code: "FORBIDDEN", message: "Not a member of this conversation" });
      }
    })();
  });

  socket.on("leave_room", ({ conversationId }) => {
    void socket.leave(conversationId);
  });

  socket.on("disconnect", () => {
    void (async () => {
      const now = new Date();
      await UserModel.findByIdAndUpdate(userId, {
        $set: { status: "offline", lastSeenAt: now },
      });
      io.emit("presence_changed", {
        userId,
        status: "offline",
        lastSeenAt: now,
      });
      logger.info({ userId }, "Socket disconnected");
    })();
  });
}
