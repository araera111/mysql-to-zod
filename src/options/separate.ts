import { z } from "zod";

export const separateOptionSchema = z.object({
	isSeparate: z.boolean().optional().default(false),
	insertPrefix: z.string().optional().default("insert"),
	insertSuffix: z.string().optional().default(""),
	selectPrefix: z.string().optional().default(""),
	selectSuffix: z.string().optional().default(""),
});

export type separateOption = z.infer<typeof separateOptionSchema>;
