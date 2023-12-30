import { z } from "zod";

export const dbConnectionOptionSchema = z.union([
	z.object({
		host: z.string(),
		port: z.number().optional().default(3306),
		user: z.string(),
		password: z.string().optional().default(""),
		database: z.string(),
	}),
	z.string(),
]);

export type DbConnectionOption = z.infer<typeof dbConnectionOptionSchema>;
