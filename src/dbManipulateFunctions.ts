import knex from "knex";
import { isEmpty } from "ramda";
import { z } from "zod";
import { getKnexConfig } from "./dbClient";

// tableの一覧をmysqlからknexで取得する関数
export const getTables = async (tableNames: string[], dbConnection: string): Promise<string[]> => {
  // tableNamesが与えられている場合は、そのまま返す
  if (!isEmpty(tableNames)) return tableNames;
  const client = knex(getKnexConfig(dbConnection));
  const [tables] = await client.raw("show tables");
  const result = tables.map((x: any) => Object.values(x)).flat();
  await client.destroy();
  return z.string().array().parse(result);
};

// table名が与えられると、そのtableの定義文を返す関数
export const getTableDefinition = async (tableName: string, dbConnection: string) => {
  const client = knex(getKnexConfig(dbConnection));
  const [table] = await client.raw("show create table ??", tableName);
  const result = table.map((x: any) => Object.values(x)).flat();
  await client.destroy();
  return z.string().array().parse(result);
};
