import { z } from "zod";
import { caseUnionSchema, nullTypeUnionSchema } from "./common";

/* 
  ex
  schema.zod.references: {
  [ 'DATE' , 'mysqlDate' ],
  [ 'DATETIME', 'mysqlDateTime'],
  [ 'BOOL' , 'mysqlBoolean' ],
  [ 'VARCHAR' , 'mysqlString' ],
*/
export const schemaZodReferencesSchema = z.tuple([z.string(), z.string()]);
export type SchemaZodReferences = z.infer<typeof schemaZodReferencesSchema>;

/* 
  ex
  schema.zod.implementation : {
  [ 'DATE' , 'z.date()' ],
  [ 'DATETIME', 'z.date()'],
  [ 'BOOL' , 'z.boolean()' ],
  [ 'VARCHAR' , 'z.string()' ],
*/
export const schemaZodImplementationSchema = z.tuple([z.string(), z.string()]);
export type SchemaZodImplementation = z.infer<
  typeof schemaZodImplementationSchema
>;

export const schemaOptionSchema = z
  .object({
    format: caseUnionSchema.default("camel"),
    prefix: z.string().default(""),
    suffix: z.string().default("Schema"),
    replacements: z.string().array().array().default([]),
    nullType: nullTypeUnionSchema,
    inline: z.boolean().default(true),
    zod: z
      .object({
        implementation: schemaZodImplementationSchema.array().optional(),
        references: schemaZodReferencesSchema.array().optional(),
      })
      .optional(),
    insert: z.boolean().default(true),
  })
  .default({
    format: "camel",
    prefix: "",
    suffix: "Schema",
    replacements: [],
    nullType: "nullable",
    inline: true,
    zod: {
      implementation: [],
      references: [],
    },
    insert: true,
  });
export type SchemaOption = z.infer<typeof schemaOptionSchema>;
