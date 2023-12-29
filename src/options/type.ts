import { z } from "zod";
import { caseUnionSchema } from "./common";

export const typeOptionSchema = z
	.object({
		declared: z.union([z.literal("none"), z.literal("type")]).default("type"),
		format: caseUnionSchema.default("pascal"),
		prefix: z.string().default(""),
		suffix: z.string().default(""),
		replacements: z.string().array().array().default([]),
	})
	.default({
		declared: "type",
		format: "pascal",
		prefix: "",
		suffix: "",
		replacements: [],
	});
export type TypeOption = z.infer<typeof typeOptionSchema>;
