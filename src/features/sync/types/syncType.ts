import { z } from "zod";

const schemaPropertySchema = z.object({
	name: z.string(),
	schema: z.string(),
});

export type SchemaProperty = z.infer<typeof schemaPropertySchema>;

export const schemaInformationSchema = z.object({
	tableName: z.string(),
	properties: schemaPropertySchema.array(),
});

export type SchemaInformation = z.infer<typeof schemaInformationSchema>;
