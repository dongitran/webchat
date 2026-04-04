import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service.js";

export async function searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    const users = await userService.searchUsers(q, limit);
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(String(req.params["id"]));
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateMyStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const { status } = req.body as { status: string };
    const user = await userService.updateUserStatus(userId, status as never);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!._id;
    const updates = req.body as { displayName?: string; avatarUrl?: string };
    const user = await userService.updateUserProfile(userId, updates);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
