import { z } from "zod";

export const caseUnionSchema = z.union([
	z.literal("camel"),
	z.literal("pascal"),
	z.literal("snake"),
	z.literal("original"),
]);
export type CaseUnion = z.infer<typeof caseUnionSchema>;

export const nullTypeUnionSchema = z
	.union([z.literal("nullable"), z.literal("nullish")])
	.default("nullable");

export type NullTypeUnion = z.infer<typeof nullTypeUnionSchema>;
