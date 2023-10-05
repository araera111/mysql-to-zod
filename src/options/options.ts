import { z } from "zod";
import {
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionCommentsSchema,
} from "./comments";
import { optionOutputSchema } from "./output";
import { schemaOptionSchema } from "./schema";
import { typeOptionSchema } from "./type";

export const mysqlToZodOptionSchema = z.object({
  output: optionOutputSchema,
  dbConnection: z.any().optional(),
  tableNames: z.string().array().default([]),
  comments: optionCommentsSchema,
  type: typeOptionSchema,
  schema: schemaOptionSchema,
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
    isUpdate: false,
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
  },
};
