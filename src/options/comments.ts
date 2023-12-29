import { z } from "zod";

/* ColumnComment */
export const defaultColumnCommentFormat = "// !name : !text";

export const optionColumnCommentsSchema = z.object({
	active: z.boolean().default(true),
	format: z.string().default(defaultColumnCommentFormat),
});
export type OptionColumnComments = z.infer<typeof optionColumnCommentsSchema>;

/* TableComment */
export const defaultTableCommentFormat = "// [table:!name] : !text";

export const optionTableCommentsSchema = z.object({
	active: z.boolean().default(true),
	format: z.string().default(defaultTableCommentFormat),
});
export type OptionTableComments = z.infer<typeof optionTableCommentsSchema>;

export const optionCommentsSchema = z
	.object({
		table: optionTableCommentsSchema.optional(),
		column: optionColumnCommentsSchema.optional(),
	})
	.default({
		table: {
			active: true,
			format: defaultTableCommentFormat,
		},
		column: {
			active: true,
			format: defaultColumnCommentFormat,
		},
	});
export type OptionComments = z.infer<typeof optionCommentsSchema>;
