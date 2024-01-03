import { z } from "zod";

export const commentKeywordSchema = z
	.object({
		keyword: z.literal("comment"),
		symbol: z.literal("="),
		value: z.string(),
	})
	.optional();

export const columnsSchema = z.object({
	column: z.string(),
	type: z.string(),
	nullable: z.boolean(),
	comment: z.string().optional(),
	autoIncrement: z.boolean().optional().default(false),
});

export type Column = z.infer<typeof columnsSchema>;
