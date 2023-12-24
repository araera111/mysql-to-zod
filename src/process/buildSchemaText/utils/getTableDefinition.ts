import mysql from "mysql2/promise";
import { z } from "zod";

export const getTableDefinition = async (
	tableName: string,
	dbConnection: string,
) => {
	const connection = await mysql.createConnection(dbConnection);
	const [table] = await connection.query("show create table ??", tableName);
	if (!Array.isArray(table)) return [];
	const result = table.map((x: any) => Object.values(x)).flat();
	await connection.destroy();
	return z.string().array().parse(result);
};
