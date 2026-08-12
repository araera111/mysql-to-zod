import { Array, Effect, Option, Predicate, pipe } from "effect";
import mysql from "mysql2/promise";
import { z } from "zod";
import type { MysqlToZodOption } from "../../options";
import {
	type DbConnectionOption,
	dbConnectionOptionSchema,
} from "../../options/dbConnection";
import { filterTable } from "./utils/getTablesUtil";

const createConnection = (
	dbConnection: DbConnectionOption,
): Effect.Effect<mysql.Connection, string> =>
	Effect.tryPromise({
		try: () =>
			typeof dbConnection === "string"
				? mysql.createConnection(dbConnection)
				: mysql.createConnection(dbConnection),
		catch: (x) => `getTablesError: ${String(x)}`,
	});

const parseDBConnection = (
	arg: unknown,
): Option.Option<DbConnectionOption> => {
	const r = dbConnectionOptionSchema.safeParse(arg);
	return r.success ? Option.some(r.data) : Option.none();
};

const stringStringObjectSchema = z.record(z.string()).array(); // {[key: string]: string}[]

// mysqlからテーブル一覧を取得する関数
export const getTables = (
	option: MysqlToZodOption,
): Effect.Effect<
	{ tableNames: readonly string[]; option: MysqlToZodOption },
	string
> =>
	Effect.gen(function* () {
		const configTableNames = option.tableNames;
		/* option.tableNamesがあればそのまま返す */
		if (Predicate.isNotNullable(configTableNames)) {
			return { tableNames: configTableNames, option };
		}

		/* dbConnectionからテーブル一覧を取得する */
		const dbConnection = yield* pipe(
			parseDBConnection(option.dbConnection),
			Effect.fromOption(() => "dbConnection is required"),
		);
		const connection = yield* createConnection(dbConnection);
		const [tables] = yield* Effect.tryPromise({
			try: () => connection.query("show tables"),
			catch: (x) => `getTablesError: ${String(x)}`,
		});
		yield* Effect.tryPromise({
			try: () => connection.destroy(),
			catch: (x) => `getTablesError: ${String(x)}`,
		});

		const tableNames = pipe(
			tables,
			stringStringObjectSchema.parse,
			Array.flatMap((x) => Object.values(x)),
			Array.filter((tableName) =>
				filterTable({ configTableNameList: configTableNames ?? [], tableName }),
			),
		);
		return { tableNames, option };
	});
