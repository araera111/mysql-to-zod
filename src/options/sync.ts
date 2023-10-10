import { z } from "zod";

export const syncOptionSchema = z
  .object({
    active: z.boolean().optional().default(true),
  })
  .optional()
  .default({
    active: true,
  });
