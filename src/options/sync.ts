import { z } from "zod";

export const syncOptionSchema = z
  .object({
    active: z.boolean().optional().default(false),
  })
  .optional()
  .default({
    active: false,
  });
