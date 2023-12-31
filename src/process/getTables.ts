import { A, AR, D, G, R, pipe } from "@mobily/ts-belt";
import mysql from "mysql2/promise";
import { z } from "zod";
import { MysqlToZodOption } from "../options";
import {
	DbConnectionOption,
	dbConnectionOptionSchema,
} from "../options/dbConnection";

const createConnection = async (
	dbConnection: DbConnectionOption,
): Promise<mysql.Connection> => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const connection = await mysql.createConnection(dbConnection as any);
	return connection;
};

const stringStringObjectSchema = z.record(z.string()).array(); // {[key: string]: string}[]
// tableの一覧をmysqlからknexで取得する関数
export const getTables = async (
	option: MysqlToZodOption,
): Promise<
	R.Result<
		{
			tableNames: readonly string[];
			option: MysqlToZodOption;
		},
		string
	>
> => {
	const tableNames = option.tableNames;
	// tableNamesが与えられている場合は、そのまま返す
	if (G.isNotNullable(tableNames) && A.isNotEmpty(tableNames)) {
		return R.Ok({ tableNames, option });
	}

	const dbConnection = dbConnectionOptionSchema.parse(option.dbConnection);

	const tableNamesResult = await pipe(
		dbConnection,
		createConnection,
		AR.make,
		AR.map(async (x) => {
			const [tables] = await x.query("show tables");
			await x.destroy();
			return tables;
		}),
		AR.flatMap((x) => AR.make(x)),
		AR.map((x) => ({
			tableNames: pipe(
				x,
				stringStringObjectSchema.parse,
				A.flatMap((x) => D.values(x)),
			),
			option,
		})),
		AR.mapError((x) => `getTablesError: ${x}`),
	);

	return tableNamesResult;
};
