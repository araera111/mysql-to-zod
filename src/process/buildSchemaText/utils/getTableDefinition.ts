import mysql from "mysql2/promise";
import { z } from "zod";
import { debugWriteFileSync } from "../../../utils/debugUtil";

export const getTableDefinition = async (
	tableName: string,
	dbConnection: string,
) => {
	const connection = await mysql.createConnection(dbConnection);
	const [table] = await connection.query("show create table ??", tableName);
	if (!Array.isArray(table)) return [];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const result = table.flatMap((x: any) => Object.values(x));
	debugWriteFileSync(result);
	await connection.destroy();
	return z.string().array().parse(result);
};
