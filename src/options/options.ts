import { z } from "zod";
import {
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionCommentsSchema,
} from "./comments";
import { outputSchema } from "./output";
import { schemaOptionSchema } from "./schema";
import { syncOptionSchema } from "./sync";
import { typeOptionSchema } from "./type";

export const mysqlToZodOptionSchema = z.object({
  output: outputSchema.optional(),
  dbConnection: z.any().optional(),
  tableNames: z.string().array().optional().default([]),
  comments: optionCommentsSchema.optional(),
  type: typeOptionSchema.optional(),
  schema: schemaOptionSchema.optional(),
  sync: syncOptionSchema.optional(),
});

export type MysqlToZodOption = z.infer<typeof mysqlToZodOptionSchema>;

export const basicMySQLToZodOption: MysqlToZodOption = {
  output: {
    outDir: "./mysqlToZod",
    fileName: "schema.ts",
  },
  tableNames: [],
  comments: {
    table: {
      active: true,
      format: defaultTableCommentFormat,
    },
    column: {
      active: true,
      format: defaultColumnCommentFormat,
    },
  },
  schema: {
    format: "camel",
    prefix: "",
    suffix: "Schema",
    replacements: [],
    nullType: "nullable",
    inline: true,
    zod: { implementation: [] },
    insert: true,
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
    insert: true,
  },
  sync: {
    active: false,
  },
};
