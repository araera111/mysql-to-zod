import mysql from "mysql2/promise";
import { isEmpty } from "ramda";
import { z } from "zod";

// tableの一覧をmysqlからknexで取得する関数
export const getTables = async (
	tableNames: string[],
	dbConnection: string,
): Promise<string[]> => {
	// tableNamesが与えられている場合は、そのまま返す
	if (!isEmpty(tableNames)) return tableNames;

	const connection = await mysql.createConnection(dbConnection);
	const [tables] = await connection.query("show tables");

	if (!Array.isArray(tables)) return [];

	const result = tables.flatMap((x: any) => Object.values(x));
	await connection.destroy();
	return z.string().array().parse(result);
};
