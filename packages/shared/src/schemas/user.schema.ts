import { z } from "zod";
import { LIMITS } from "../constants/limits.js";

export const UpdateStatusSchema = z.object({
  status: z.enum(["online", "idle", "dnd", "offline"]),
});

export const UpdateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(LIMITS.DISPLAY_NAME_MAX_LENGTH).optional(),
    // HTTPS only — prevents stored SSRF via redirect to internal services
    avatarUrl: z.url().startsWith("https://").optional(),
  })
  .refine((data) => data.displayName !== undefined || data.avatarUrl !== undefined, {
    message: "At least one field (displayName or avatarUrl) must be provided",
  });

export const SearchUsersQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(LIMITS.SEARCH_RESULTS_MAX).default(10),
});

export const UserParamsSchema = z.object({
  id: z.string().length(24, "Must be a valid 24-character MongoDB ObjectId"),
});
