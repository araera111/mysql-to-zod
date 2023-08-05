import { z } from "zod";
import { caseUnionSchema, nullTypeUnionSchema } from "./common";

export const schemaZodImplementationSchema = z.tuple([z.string(), z.string()]);
export type SchemaZodImplementation = z.infer<
  typeof schemaZodImplementationSchema
>;

export const schemaZodImplementationListSchema = z.array(
  schemaZodImplementationSchema
);
export type SchemaZodImplementationList = z.infer<
  typeof schemaZodImplementationListSchema
>;

export const SchemaOptionSchema = z.object({
  format: caseUnionSchema.default("camel"),
  prefix: z.string().default(""),
  suffix: z.string().default("Schema"),
  replacements: z.string().array().array().default([]),
  nullType: nullTypeUnionSchema,
  zod: z
    .object({ implementation: schemaZodImplementationListSchema.optional() })
    .optional(),
});
export type SchemaOption = z.infer<typeof SchemaOptionSchema>;
