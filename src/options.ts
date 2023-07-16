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
  // isInvalidDateToValidDate: z.boolean().optional().default(true),
  // dbConnectionLimit: z.number().optional().default(1),
});
// type
export type MysqlToZodOption = z.infer<typeof mysqlToZodOptionSchema>;
