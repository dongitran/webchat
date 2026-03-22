export interface IUser {
  _id: string;
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  status: UserStatus;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation {
  _id: string;
  type: ConversationType;
  name: string | null;
  dmKey: string | null;
  participants: string[];
  lastMessageId: string | null;
  sequenceCounter: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  sequenceNumber: number;
  content: string;
  contentType: ContentType;
  replyTo: string | null;
  reactions: IReaction[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReaction {
  emoji: string;
  userId: string;
}

export interface IMessageReceipt {
  _id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  status: ReceiptStatus;
  deliveredAt: Date | null;
  readAt: Date | null;
}

export interface IConversationMember {
  _id: string;
  conversationId: string;
  userId: string;
  role: ConversationRole;
  nickname: string | null;
  unreadCount: number;
  lastReadMessageId: string | null;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface IRefreshToken {
  _id: string;
  userId: string;
  tokenHash: string;
  family: string;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
  isRevoked: boolean;
  createdAt: Date;
}

export type UserStatus = "online" | "idle" | "dnd" | "offline";
export type ConversationType = "direct" | "group";
export type ContentType = "text" | "image" | "file";
export type ReceiptStatus = "delivered" | "read";
export type ConversationRole = "owner" | "admin" | "member";
