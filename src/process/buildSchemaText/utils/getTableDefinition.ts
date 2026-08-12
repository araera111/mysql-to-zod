import { Effect, Predicate } from "effect";
import mysql from "mysql2/promise";
import { z } from "zod";
import type { MysqlToZodOption } from "../../../options";
import { outputSqlToFile } from "../../outputToFile/outputToFile";

export type RequestForTable = {
	tableName: string;
	option: MysqlToZodOption;
};

export const getTableDefinition = ({
	tableName,
	option,
}: RequestForTable): Effect.Effect<string[], string> =>
	Effect.gen(function* () {
		const dbConnection = option.dbConnection;
		if (Predicate.isNullable(dbConnection)) return [];

		const connection = yield* Effect.tryPromise({
			try: () =>
				typeof dbConnection === "string"
					? mysql.createConnection(dbConnection)
					: mysql.createConnection(dbConnection),
			catch: (x) => `getTableDefinitionError: ${String(x)}`,
		});
		try {
			const [table] = yield* Effect.tryPromise({
				try: () => connection.query("show create table ??", tableName),
				catch: (x) => `getTableDefinitionError: ${String(x)}`,
			});
			if (!Array.isArray(table)) return [];

			// mysql2@3.11.0\node_modules\mysql2\typings\mysql\lib\Connection.d.ts
			const result = table.flatMap((x) => Object.values(x));
			const sql = z.string().array().parse(result);
			if (option.output?.saveSql) {
				yield* outputSqlToFile({ sql, output: option.output });
			}
			return sql;
		} finally {
			yield* Effect.tryPromise({
				try: () => connection.destroy(),
				catch: () => undefined,
			});
		}
	});
