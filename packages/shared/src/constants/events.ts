export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  SEND_MESSAGE: "send_message",
  MESSAGE_DELIVERED: "message_delivered",
  MESSAGE_READ: "message_read",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  PRESENCE_UPDATE: "presence_update",

  // Server → Client
  NEW_MESSAGE: "new_message",
  MESSAGE_UPDATED: "message_updated",
  MESSAGE_DELETED: "message_deleted",
  MESSAGE_STATUS_CHANGED: "message_status_changed",
  USER_TYPING: "user_typing",
  USER_STOPPED_TYPING: "user_stopped_typing",
  PRESENCE_CHANGED: "presence_changed",
  REACTION_ADDED: "reaction_added",
  REACTION_REMOVED: "reaction_removed",
  ERROR: "error",
} as const;
