import type {
  IUser,
  IConversation,
  IMessage,
  UserStatus,
  ConversationType,
} from "./models.types.js";

// === Auth ===
export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: IUser;
}

export interface DevLoginBody {
  email: string;
  displayName: string;
}

// === Users ===
export interface SearchUsersQuery {
  q: string;
  limit?: number;
}

export interface SearchUsersResponse {
  users: IUser[];
}

export interface UpdateStatusBody {
  status: UserStatus;
}

export interface UpdateProfileBody {
  displayName?: string;
  avatarUrl?: string;
}

// === Conversations ===
export interface CreateConversationBody {
  type: ConversationType;
  participantIds: string[];
  name?: string;
}

export interface ListConversationsQuery {
  page?: number;
  limit?: number;
}

export interface IConversationWithMeta extends IConversation {
  unreadCount: number;
  lastReadMessageId: string | null;
  participantDetails: Pick<IUser, "_id" | "displayName" | "avatarUrl" | "status">[];
}

export interface ListConversationsResponse {
  conversations: IConversationWithMeta[];
  total: number;
}

// === Messages ===
export interface SendMessageBody {
  clientMessageId: string;
  content: string;
  contentType?: "text" | "image" | "file";
  replyTo?: string;
}

export interface ListMessagesQuery {
  before?: string;
  limit?: number;
}

export interface ListMessagesResponse {
  messages: IMessage[];
  hasMore: boolean;
}

export interface EditMessageBody {
  content: string;
}

export interface AddReactionBody {
  emoji: string;
}

// === Health ===
export interface HealthResponse {
  status: "ok" | "degraded";
}

export interface HealthDetailResponse extends HealthResponse {
  uptime: number;
  mongo: "connected" | "disconnected";
  redis: "connected" | "disconnected";
  version: string;
}

// === Error ===
export interface ApiError {
  error: string;
  code: string;
  details?: unknown;
}

// === Pagination ===
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
