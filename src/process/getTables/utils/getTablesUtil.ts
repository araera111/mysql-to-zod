import { O } from "@mobily/ts-belt";
import mysql from "mysql2/promise";
import {
	DbConnectionOption,
	dbConnectionOptionSchema,
} from "../../../options/dbConnection";

export const createConnection = async (
	dbConnection: DbConnectionOption,
): Promise<mysql.Connection> => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const connection = await mysql.createConnection(dbConnection as any);
	return connection;
};

export const parseDBConnection = (
	arg: unknown,
): O.Option<DbConnectionOption> => {
	const r = dbConnectionOptionSchema.safeParse(arg);
	if (r.success) return O.Some(r.data);
	return O.None;
};
