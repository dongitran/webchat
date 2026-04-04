import type { Request, Response, NextFunction } from "express";
import * as messageService from "../services/message.service.js";
import type { ContentType } from "@webchat/shared";

export async function listMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const conversationId = String(req.params["id"]);
    const { before, limit } = req.query as unknown as { before?: string; limit: number };
    const result = await messageService.listMessages(userId, conversationId, before, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const conversationId = String(req.params["id"]);
    const body = req.body as {
      clientMessageId: string;
      content: string;
      contentType?: ContentType;
      replyTo?: string;
    };
    const message = await messageService.sendMessage(userId, conversationId, body);
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { content } = req.body as { content: string };
    const message = await messageService.editMessage(userId, String(req.params["id"]), content);
    res.json({ message });
  } catch (error) {
    next(error);
  }
}

export async function deleteMessage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    await messageService.deleteMessage(userId, String(req.params["id"]));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function addReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!._id;
    const { emoji } = req.body as { emoji: string };
    const message = await messageService.addReaction(userId, String(req.params["id"]), emoji);
    res.json({ message });
  } catch (error) {
    next(error);
  }
}

export async function removeReaction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const message = await messageService.removeReaction(
      userId,
      String(req.params["id"]),
      String(req.params["emoji"]),
    );
    res.json({ message });
  } catch (error) {
    next(error);
  }
}
