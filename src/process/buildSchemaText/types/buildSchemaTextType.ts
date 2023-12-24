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
	auto_increment: z.boolean().optional(),
});

export type Column = z.infer<typeof columnsSchema>;

export const schemaResultSchema = z.object({
	schema: z.string(),
	columns: columnsSchema.array(),
});

export type SchemaResult = z.infer<typeof schemaResultSchema>;
