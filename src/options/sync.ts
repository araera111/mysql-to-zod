import { z } from "zod";

export const syncOptionSchema = z
  .object({
    active: z.boolean().optional().default(true),
    keySyncType: z
      .union([z.literal("none"), z.literal("commentOut"), z.literal("delete")])
      .optional()
      .default("delete"),
    tableSyncType: z
      .union([z.literal("none"), z.literal("commentOut"), z.literal("delete")])
      .optional()
      .default("delete"),
  })
  .optional()
  .default({
    active: true,
    keySyncType: "delete",
    tableSyncType: "delete",
  });
