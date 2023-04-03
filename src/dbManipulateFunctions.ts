import { writeFile } from "fs-extra";
import mysql from "mysql2/promise";
import { isEmpty } from "ramda";
import { z } from "zod";
// tableの一覧をmysqlからknexで取得する関数
export const getTables = async (tableNames: string[], dbConnection: string): Promise<string[]> => {
  // tableNamesが与えられている場合は、そのまま返す
  if (!isEmpty(tableNames)) return tableNames;
  const connection = await mysql.createConnection(dbConnection);
  const [tables] = await connection.query("show tables");
  if (!Array.isArray(tables)) return [];
  const result = tables.map((x: any) => Object.values(x)).flat();
  await connection.destroy();
  return z.string().array().parse(result);
};

// table名が与えられると、そのtableの定義文を返す関数
export const getTableDefinition = async (tableName: string, dbConnection: string) => {
  const connection = await mysql.createConnection(dbConnection);
  const [table] = await connection.query("show create table ??", tableName);
  writeFile("./debug.json", JSON.stringify(table + tableName, null, 2));
  if (!Array.isArray(table)) return [];
  const result = table.map((x: any) => Object.values(x)).flat();
  await connection.destroy();
  return z.string().array().parse(result);
};
