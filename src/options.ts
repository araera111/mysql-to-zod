import { z } from "zod";

/*
  isAddType: boolean,
  isCamel: boolean
  ファイル出力先のパス: string
  ファイル名: string
  ファイルが存在していた場合、上書きをするかどうか: boolean
  DBの接続情報: string
  取得するテーブル名: string[]
  exportをつけるかどうか: boolean
  型名をアッパーキャメルケースにするかどうか: boolean
  nullのタイプ nullish or nullable default: nullable
  isDateToString:Date型をstringにするかどうか: boolean
*/

const caseUnionSchema = z.union([
  z.literal("camel"),
  z.literal("pascal"),
  z.literal("snake"),
  z.literal("none"),
  z.literal("replace"),
]);

export const defaultTypeOptionSchema = z.object({
  declared: z
    .union([z.literal("none"), z.literal("type"), z.literal("interface")])
    .default("none"),
  format: caseUnionSchema.default("pascal"),
  suffix: z.string().default(""),
  prefix: z.string().default(""),
  replacements: z.string().array().default([]),
});
export type DefaultTypeOption = z.infer<typeof defaultTypeOptionSchema>;

export const defaultSchemaOptionSchema = z.object({
  format: caseUnionSchema.default("camel"),
  prefix: z.string().default(""),
  suffix: z.string().default("Schema"),
  replacements: z.string().array().default([]),
  nullType: z
    .union([z.literal("nullable"), z.literal("nullish")])
    .optional()
    .default("nullable"),
});
export type DefaultSchemaOption = z.infer<typeof defaultSchemaOptionSchema>;

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

/* 
  schemaFormat: {
  　型定義をつけるかどうか、という変数名
    isAddType: boolean,
    
  }
*/

export const mysqlToZodOptionSchema = z.object({
  isAddType: z.boolean().optional().default(true), // I hope to have it DEPRECATED in the near future.
  isCamel: z.boolean().optional().default(true), // I hope to have it DEPRECATED in the near future.
  isTypeUpperCamel: z.boolean().optional().default(true), // I hope to have it DEPRECATED in the near future.
  outFilePath: z.string().optional().default("./mysqlToZod"),
  fileName: z.string().optional().default("schema.ts"),
  dbConnection: z.any().optional(),
  tableNames: z.string().array().optional().default([]),
  nullType: z
    .union([z.literal("nullable"), z.literal("nullish")])
    .optional()
    .default("nullable"), // I hope to have it DEPRECATED in the near future.
  comments: optionCommentsSchema.optional(),
  type: defaultTypeOptionSchema.optional(),
  schema: defaultSchemaOptionSchema.optional(),
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
};
