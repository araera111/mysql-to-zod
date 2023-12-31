import { G } from "@mobily/ts-belt";
import mysql from "mysql2/promise";
import { isEmpty } from "ramda";
import { z } from "zod";
import { DbConnectionOption } from "../options/dbConnection";

// tableの一覧をmysqlからknexで取得する関数
export const getTables = async (
	tableNames: string[],
	dbConnection: DbConnectionOption,
): Promise<string[]> => {
	// tableNamesが与えられている場合は、そのまま返す
	if (G.isNotNullable(tableNames) && !isEmpty(tableNames)) return tableNames;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const connection = await mysql.createConnection(dbConnection as any);
	const [tables] = await connection.query("show tables");
	if (!Array.isArray(tables)) return [];

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const result = tables.flatMap((x: any) => Object.values(x));
	await connection.destroy();
	return z.string().array().parse(result);
};
