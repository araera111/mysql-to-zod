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
  DBに同時接続する数: number
  nullのタイプ nullish or nullable default: nullable
  isDateToString:Date型をstringにするかどうか: boolean
*/

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

export const mysqlToZodOptionSchema = z.object({
  isAddType: z.boolean().optional().default(true),
  isCamel: z.boolean().optional().default(true),
  isTypeUpperCamel: z.boolean().optional().default(true),
  outFilePath: z.string().optional().default("./mysqlToZod"),
  fileName: z.string().optional().default("schema.ts"),
  dbConnection: z.any().optional(),
  tableNames: z.string().array().optional().default([]),
  nullType: z
    .union([z.literal("nullable"), z.literal("nullish")])
    .optional()
    .default("nullable"),
  comments: optionCommentsSchema.optional(),
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
