import { z } from "zod";
import {
  defaultColumnCommentFormat,
  defaultTableCommentFormat,
  optionCommentsSchema,
} from "./comments";
import { nullTypeUnionSchema } from "./common";
import { SchemaOptionSchema } from "./schema";
import { typeOptionSchema } from "./type";

export const mysqlToZodOptionSchema = z.object({
  isAddType: z.boolean().optional(), // I hope to have it DEPRECATED in the near future.
  isCamel: z.boolean().optional(), // I hope to have it DEPRECATED in the near future.
  isTypeUpperCamel: z.boolean().optional(), // I hope to have it DEPRECATED in the near future.
  outFilePath: z.string().optional().default("./mysqlToZod"),
  fileName: z.string().optional().default("schema.ts"),
  dbConnection: z.any().optional(),
  tableNames: z.string().array().optional().default([]),
  nullType: nullTypeUnionSchema, // I hope to have it DEPRECATED in the near future.
  comments: optionCommentsSchema.optional(),
  type: typeOptionSchema.optional(),
  schema: SchemaOptionSchema.optional(),
});

export type MysqlToZodOption = z.infer<typeof mysqlToZodOptionSchema>;

export const basicMySQLToZodOption: MysqlToZodOption = {
  isAddType: true,
  isCamel: true,
  isTypeUpperCamel: true,
  outFilePath: "./mysqlToZod",
  fileName: "schema.ts",
  tableNames: [],
  nullType: "nullable",
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
