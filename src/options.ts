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
*/
export const mysqlToZodOptionSchema = z.object({
  isAddType: z.boolean().optional().default(true),
  isCamel: z.boolean().optional().default(true),
  // isOverwrite: z.boolean().optional().default(true),
  // isExport: z.boolean().optional().default(true),
  isTypeUpperCamel: z.boolean().optional().default(true),
  outFilePath: z.string().optional().default("./mysqlToZod"),
  fileName: z.string().optional().default("schema.ts"),
  dbConnection: z.string(),
  tableNames: z.string().array().optional().default([]),
  // useNullish: z.boolean().optional(),
  // dbConnectionLimit: z.number().optional().default(1),
});
// type
export type MysqlToZodOption = z.infer<typeof mysqlToZodOptionSchema>;