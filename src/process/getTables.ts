import { A, AR, D, G, O, R, pipe } from "@mobily/ts-belt";
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

const parseDBConnection = (arg: unknown): O.Option<DbConnectionOption> => {
	const r = dbConnectionOptionSchema.safeParse(arg);
	if (r.success) return O.Some(r.data);
	return O.None;
};

const stringStringObjectSchema = z.record(z.string()).array(); // {[key: string]: string}[]
// tableの一覧をmysqlからknexで取得する関数
export const getTables = (
	option: MysqlToZodOption,
): Promise<
	R.Result<
		{
			tableNames: readonly string[];
			option: MysqlToZodOption;
		},
		string
	>
> =>
	pipe(
		option.tableNames,
		O.fromPredicate((x) => G.isNullable(x) || A.isEmpty(x)),
		O.match(
			/* If options has tableNames, return as is */
			async (some) => R.Ok({ tableNames: some, option }),
			() => {
				/* Whether there is a dbConnection in options or args */
				return R.match(
					pipe(
						option,
						(x) => x.dbConnection,
						parseDBConnection,
						O.toResult("dbConnection is required"),
					),
					/* If there is a dbConnection, show tables to get tableNames */
					(ok) =>
						pipe(
							ok,
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
						),
					async (err) => {
						return R.Error(err);
					},
				);
			},
		),
	);
