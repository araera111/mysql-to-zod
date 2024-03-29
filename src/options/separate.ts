import { z } from "zod";

export const separateOptionSchema = z
	.object({
		isSeparate: z.boolean().optional().default(false),
		insertPrefix: z.string().optional().default("insert"),
		insertSuffix: z.string().optional().default(""),
	})
	.partial();

export type separateOption = z.infer<typeof separateOptionSchema>;
