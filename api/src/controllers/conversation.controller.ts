import type { Request, Response, NextFunction } from "express";
import * as conversationService from "../services/conversation.service.js";
import type { ConversationType } from "@webchat/shared";

export async function createConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { type, participantIds, name } = req.body as {
      type: ConversationType;
      participantIds: string[];
      name?: string;
    };
    const conversation = await conversationService.createConversation(
      userId,
      type,
      participantIds,
      name,
    );
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function listConversations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await conversationService.listConversations(userId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const conversation = await conversationService.getConversationById(
      userId,
      String(req.params["id"]),
    );
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function updateConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { name } = req.body as { name: string };
    const conversation = await conversationService.updateConversationName(
      userId,
      String(req.params["id"]),
      name,
    );
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
}

export async function leaveConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    await conversationService.leaveConversation(userId, String(req.params["id"]));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getConversationMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const members = await conversationService.getConversationMembers(
      userId,
      String(req.params["id"]),
    );
    res.json({ members });
  } catch (error) {
    next(error);
  }
}
