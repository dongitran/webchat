import type { IMessage, UserStatus, ReceiptStatus, ContentType } from "./models.types.js";

export interface ClientToServerEvents {
  join_room: (data: { conversationId: string }) => void;
  leave_room: (data: { conversationId: string }) => void;

  send_message: (
    data: {
      conversationId: string;
      clientMessageId: string;
      content: string;
      contentType: ContentType;
      replyTo?: string;
    },
    ack: (response: { messageId: string; sequenceNumber: number } | { error: string }) => void,
  ) => void;

  message_delivered: (data: { messageId: string; conversationId: string }) => void;

  message_read: (data: { messageIds: string[]; conversationId: string }) => void;

  typing_start: (data: { conversationId: string }) => void;
  typing_stop: (data: { conversationId: string }) => void;

  presence_update: (data: { status: UserStatus }) => void;
}

export interface ServerToClientEvents {
  new_message: (data: { message: IMessage; conversationId: string }) => void;

  message_updated: (data: { message: IMessage; conversationId: string }) => void;

  message_deleted: (data: { messageId: string; conversationId: string }) => void;

  message_status_changed: (data: {
    messageId: string;
    conversationId: string;
    status: ReceiptStatus;
    userId: string;
    timestamp: Date;
  }) => void;

  user_typing: (data: { conversationId: string; userId: string; displayName: string }) => void;

  user_stopped_typing: (data: { conversationId: string; userId: string }) => void;

  presence_changed: (data: { userId: string; status: UserStatus; lastSeenAt: Date }) => void;

  reaction_added: (data: {
    messageId: string;
    conversationId: string;
    emoji: string;
    userId: string;
  }) => void;

  reaction_removed: (data: {
    messageId: string;
    conversationId: string;
    emoji: string;
    userId: string;
  }) => void;

  error: (data: { code: string; message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  email: string;
}
