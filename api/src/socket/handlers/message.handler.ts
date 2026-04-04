import type { AppServer } from "../../config/socket.js";
import type { Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@webchat/shared";
import { SendMessageSchema } from "@webchat/shared";
import * as messageService from "../../services/message.service.js";
import { logger } from "../../lib/logger.js";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type SendAck = (
  response: { messageId: string; sequenceNumber: number } | { error: string },
) => void;

export function registerMessageHandlers(io: AppServer, socket: AppSocket): void {
  const userId = socket.data.userId;

  socket.on("send_message", (data, ack: SendAck) => {
    void (async () => {
      const parsed = SendMessageSchema.safeParse(data);
      if (!parsed.success) {
        ack({ error: "Invalid payload" });
        return;
      }

      try {
        const { conversationId, clientMessageId, content, contentType, replyTo } = parsed.data;
        const message = await messageService.sendMessage(userId, conversationId, {
          clientMessageId,
          content,
          contentType,
          replyTo,
        });

        // Broadcast to all room members (including sender for multi-device sync)
        io.to(conversationId).emit("new_message", { message, conversationId });

        ack({ messageId: message._id, sequenceNumber: message.sequenceNumber });
      } catch (error: unknown) {
        logger.warn({ err: error, userId }, "send_message failed");
        const msg = error instanceof Error ? error.message : "Failed to send message";
        ack({ error: msg });
      }
    })();
  });

  socket.on("message_delivered", ({ messageId, conversationId }) => {
    void (async () => {
      try {
        await messageService.markMessageDelivered(userId, messageId, conversationId);
        io.to(conversationId).emit("message_status_changed", {
          messageId,
          conversationId,
          status: "delivered",
          userId,
          timestamp: new Date(),
        });
      } catch (error: unknown) {
        logger.warn({ err: error, userId, messageId }, "message_delivered failed");
      }
    })();
  });

  socket.on("message_read", ({ messageIds, conversationId }) => {
    void (async () => {
      try {
        await messageService.markMessagesRead(userId, conversationId, messageIds);
        for (const messageId of messageIds) {
          io.to(conversationId).emit("message_status_changed", {
            messageId,
            conversationId,
            status: "read",
            userId,
            timestamp: new Date(),
          });
        }
      } catch (error: unknown) {
        logger.warn({ err: error, userId }, "message_read failed");
      }
    })();
  });
}
