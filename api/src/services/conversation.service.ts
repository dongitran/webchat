import { Types, type FilterQuery } from "mongoose";
import type {
  IConversation,
  IConversationWithMeta,
  ConversationType,
  IUser,
} from "@webchat/shared";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";
import { ConversationModel, type IConversationDocument } from "../models/conversation.model.js";
import {
  ConversationMemberModel,
  type IConversationMemberDocument,
} from "../models/conversation-member.model.js";
import { UserModel } from "../models/user.model.js";
import { assertMembership } from "../middleware/guards.js";

function buildDmKey(id1: string, id2: string): string {
  // Sorted to guarantee same key regardless of participant order
  return [id1, id2].toSorted((a, b) => a.localeCompare(b)).join(":");
}

function docToIConversation(doc: Record<string, unknown>): IConversation {
  return {
    _id: String(doc._id),
    type: (doc.conversationType ?? doc.type) as ConversationType,
    name: (doc.name as string | null) ?? null,
    dmKey: (doc.dmKey as string | null) ?? null,
    participants: (doc.participants as unknown[]).map(String),
    lastMessageId: doc.lastMessageId ? String(doc.lastMessageId) : null,
    sequenceCounter: doc.sequenceCounter as number,
    createdBy: String(doc.createdBy),
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export async function createConversation(
  creatorId: string,
  type: ConversationType,
  participantIds: string[],
  name?: string,
): Promise<IConversation> {
  const allParticipants = [...new Set([creatorId, ...participantIds])];

  if (type === "direct") {
    if (allParticipants.length !== 2) {
      throw new ForbiddenError("Direct conversations require exactly 2 participants");
    }
    const dmKey = buildDmKey(allParticipants[0]!, allParticipants[1]!);

    // Idempotent: return existing DM if already exists
    const filter: FilterQuery<IConversationDocument> = { dmKey };
    const existing = await ConversationModel.findOne(filter).lean<Record<string, unknown>>();
    if (existing) return docToIConversation(existing);

    const participantObjectIds = allParticipants.map((id) => new Types.ObjectId(id));
    const conversation = await ConversationModel.create({
      conversationType: "direct" as const,
      dmKey,
      participants: participantObjectIds,
      createdBy: new Types.ObjectId(creatorId),
    });

    await ConversationMemberModel.insertMany(
      allParticipants.map((uid) => ({
        conversationId: conversation._id,
        userId: new Types.ObjectId(uid),
        joinedAt: new Date(),
      })),
    );

    return docToIConversation(conversation.toObject() as Record<string, unknown>);
  }

  const participantObjectIds = allParticipants.map((id) => new Types.ObjectId(id));
  const conversation = await ConversationModel.create({
    conversationType: "group" as const,
    name: name ?? null,
    participants: participantObjectIds,
    createdBy: new Types.ObjectId(creatorId),
  });

  await ConversationMemberModel.insertMany(
    allParticipants.map((uid) => ({
      conversationId: conversation._id,
      userId: new Types.ObjectId(uid),
      joinedAt: new Date(),
    })),
  );

  return docToIConversation(conversation.toObject() as Record<string, unknown>);
}

export async function listConversations(
  userId: string,
  page: number,
  limit: number,
): Promise<{ conversations: IConversationWithMeta[]; total: number }> {
  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    ConversationMemberModel.find({ userId, leftAt: null })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<
        Array<{
          _id: unknown;
          conversationId: unknown;
          unreadCount: number;
          lastReadMessageId: unknown;
        }>
      >(),
    ConversationMemberModel.countDocuments({ userId, leftAt: null }),
  ]);

  const conversationIds = members.map((m) => m.conversationId);
  const conversations = await ConversationModel.find({ _id: { $in: conversationIds } })
    .sort({ updatedAt: -1 })
    .lean<Record<string, unknown>[]>();

  const memberMap = new Map(members.map((m) => [String(m.conversationId), m]));

  const participantIds = [
    ...new Set(conversations.flatMap((c) => (c.participants as unknown[]).map(String))),
  ];
  const users = await UserModel.find({ _id: { $in: participantIds } }).lean<
    Record<string, unknown>[]
  >();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const result: IConversationWithMeta[] = conversations.map((c) => {
    const member = memberMap.get(String(c._id));
    const details = (c.participants as unknown[]).map((pid) => {
      const u = userMap.get(String(pid));
      return {
        _id: String(pid),
        displayName: (u?.displayName as string) ?? "Unknown",
        avatarUrl: (u?.avatarUrl as string) ?? "",
        status: (u?.status as IUser["status"]) ?? "offline",
      };
    });
    return {
      ...docToIConversation(c),
      unreadCount: member?.unreadCount ?? 0,
      lastReadMessageId: member?.lastReadMessageId ? String(member.lastReadMessageId) : null,
      participantDetails: details,
    };
  });

  return { conversations: result, total };
}

export async function getConversationById(
  userId: string,
  conversationId: string,
): Promise<IConversationWithMeta> {
  await assertMembership(userId, conversationId);

  const convFilter: FilterQuery<IConversationDocument> = { _id: conversationId };
  const memberFilter: FilterQuery<IConversationMemberDocument> = { conversationId, userId };

  const [conv, member] = await Promise.all([
    ConversationModel.findOne(convFilter).lean<Record<string, unknown>>(),
    ConversationMemberModel.findOne(memberFilter).lean<{
      unreadCount: number;
      lastReadMessageId: unknown;
    }>(),
  ]);

  if (!conv) throw new NotFoundError("Conversation not found");

  const participantIds = (conv.participants as unknown[]).map(String);
  const users = await UserModel.find({ _id: { $in: participantIds } }).lean<
    Record<string, unknown>[]
  >();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const details = participantIds.map((pid) => {
    const u = userMap.get(pid);
    return {
      _id: pid,
      displayName: (u?.displayName as string) ?? "Unknown",
      avatarUrl: (u?.avatarUrl as string) ?? "",
      status: (u?.status as IUser["status"]) ?? "offline",
    };
  });

  return {
    ...docToIConversation(conv),
    unreadCount: member?.unreadCount ?? 0,
    lastReadMessageId: member?.lastReadMessageId ? String(member.lastReadMessageId) : null,
    participantDetails: details,
  };
}

export async function updateConversationName(
  userId: string,
  conversationId: string,
  name: string,
): Promise<IConversation> {
  await assertMembership(userId, conversationId);

  const conv = await ConversationModel.findByIdAndUpdate(
    conversationId,
    { $set: { name } },
    { new: true },
  ).lean<Record<string, unknown>>();

  if (!conv) throw new NotFoundError("Conversation not found");
  return docToIConversation(conv);
}

export async function leaveConversation(userId: string, conversationId: string): Promise<void> {
  await assertMembership(userId, conversationId);

  await ConversationMemberModel.updateOne(
    { conversationId, userId } as FilterQuery<IConversationMemberDocument>,
    { $set: { leftAt: new Date() } },
  );
}

export async function getConversationMembers(
  userId: string,
  conversationId: string,
): Promise<Pick<IUser, "_id" | "displayName" | "avatarUrl" | "status">[]> {
  await assertMembership(userId, conversationId);

  const members = await ConversationMemberModel.find({ conversationId, leftAt: null }).lean<
    Array<{ userId: unknown }>
  >();

  const userIds = members.map((m) => m.userId);
  const users = await UserModel.find({ _id: { $in: userIds } }).lean<Record<string, unknown>[]>();

  return users.map((u) => ({
    _id: String(u._id),
    displayName: u.displayName as string,
    avatarUrl: (u.avatarUrl as string) ?? "",
    status: (u.status as IUser["status"]) ?? "offline",
  }));
}
