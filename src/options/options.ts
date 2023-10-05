import { z } from "zod";
import {
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionCommentsSchema,
} from "./comments";
import { outputSchema } from "./output";
import { schemaOptionSchema } from "./schema";
import { typeOptionSchema } from "./type";
import { updateOptionSchema } from "./update";

export const mysqlToZodOptionSchema = z.object({
  output: outputSchema.optional(),
  dbConnection: z.any().optional(),
  tableNames: z.string().array().optional().default([]),
  comments: optionCommentsSchema.optional(),
  type: typeOptionSchema.optional(),
  schema: schemaOptionSchema.optional(),
  update: updateOptionSchema.optional(),
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
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
  },
};
