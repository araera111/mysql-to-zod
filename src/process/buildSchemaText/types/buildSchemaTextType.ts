import { z } from "zod";

export const commentKeywordSchema = z
  .object({
    keyword: z.literal("comment"),
    symbol: z.literal("="),
    value: z.string(),
  })
  .optional();
