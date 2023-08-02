import { z } from "zod";

/*
  isAddType: boolean,
  isCamel: boolean
  ファイル出力先のパス: string
  ファイル名: string
  ファイルが存在していた場合、上書きをするかどうか: boolean
  DBの接続情報: string
  取得するテーブル名: string[]
  型名をアッパーキャメルケースにするかどうか: boolean
  nullのタイプ nullish or nullable default: nullable
*/

const caseUnionSchema = z.union([
  z.literal("camel"),
  z.literal("pascal"),
  z.literal("snake"),
  z.literal("original"),
]);
export type CaseUnion = z.infer<typeof caseUnionSchema>;

export const typeOptionSchema = z.object({
  declared: z
    .union([z.literal("none"), z.literal("type"), z.literal("interface")])
    .default("type"),
  format: caseUnionSchema.default("pascal"),
  prefix: z.string().default(""),
  suffix: z.string().default(""),
  replacements: z.string().array().array().default([]),
});
export type TypeOption = z.infer<typeof typeOptionSchema>;
export const nullTypeUnionSchema = z
  .union([z.literal("nullable"), z.literal("nullish")])
  .default("nullable");

export type NullTypeUnion = z.infer<typeof nullTypeUnionSchema>;

export const SchemaOptionSchema = z.object({
  format: caseUnionSchema.default("camel"),
  prefix: z.string().default(""),
  suffix: z.string().default("Schema"),
  replacements: z.string().array().array().default([]),
  nullType: nullTypeUnionSchema,
});
export type SchemaOption = z.infer<typeof SchemaOptionSchema>;

/* ColumnComment */
export const defaultColumnCommentFormat = "// !name : !text";

export const optionColumnCommentsSchema = z.object({
  active: z.boolean().default(true),
  format: z.string().default(defaultColumnCommentFormat),
});
export type OptionColumnComments = z.infer<typeof optionColumnCommentsSchema>;

/* TableComment */
export const defaultTableCommentFormat = "// [table:!name] : !text";

export const optionTableCommentsSchema = z.object({
  active: z.boolean().default(true),
  format: z.string().default(defaultTableCommentFormat),
});
export type OptionTableComments = z.infer<typeof optionTableCommentsSchema>;

export const optionCommentsSchema = z.object({
  table: optionTableCommentsSchema.optional(),
  column: optionColumnCommentsSchema.optional(),
});
export type OptionComments = z.infer<typeof optionCommentsSchema>;

/* custom schema */
export const customSchemaOptionSchema = z.union([
  z.tuple([z.string(), z.string()]),
  z.tuple([z.string(), z.string(), z.string()]),
]);
export type CustomSchemaOption = z.infer<typeof customSchemaOptionSchema>;

export const customSchemaOptionListSchema = z.array(customSchemaOptionSchema);
export type CustomSchemaOptionList = z.infer<
  typeof customSchemaOptionListSchema
>;

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
  customSchema: customSchemaOptionListSchema.optional(),
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
  },
  type: {
    declared: "type",
    format: "pascal",
    prefix: "",
    suffix: "",
    replacements: [],
  },
  customSchema: [["", "", ""]],
};
