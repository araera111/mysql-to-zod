import { AR, R, pipe } from "@mobily/ts-belt";
import { z } from "zod";
import { debugWriteFileSync } from "../../../utils/debugUtil";
import { createConnection } from "../../getTables/utils/getTablesUtil";

export const getTableDefinition = async (
	tableName: string,
	dbConnection: string,
) =>
	pipe(
		dbConnection,
		createConnection,
		AR.make,
		AR.flatMap(async (x) => {
			const q = async () => await x.query(`show create table ${tableName}`);
			const p = await pipe(
				x,
				q,
				AR.make,
				AR.mapError((x) => `getTableDefinitionError: ${x}`),
			);
			await x.destroy();
			return p;
		}),
		AR.flatMap(async (x) => {
			const table = await x;
			debugWriteFileSync(table);
			if (!Array.isArray(table)) {
				return R.Error("getTableDefinitionError: table is not array");
			}
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const result = table[0].flatMap((x: any) => Object.values(x));
			return R.Ok(z.string().array().parse(result));
		}),
		AR.mapError((x) => `getTableDefinitionError: ${x}`),
	);
