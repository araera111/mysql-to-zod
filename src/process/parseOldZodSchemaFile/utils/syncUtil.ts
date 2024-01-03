import { R, pipe } from "@mobily/ts-belt";
import { readFileSync } from "fs-extra";
import { join } from "path";
import { MysqlToZodOption } from "../../../options";
import { SchemaInformation, schemaInformationSchema } from "../types/syncType";
import { parse } from "./zodParse";

export const getSchemaInformation = (
	text: string,
): R.Result<SchemaInformation[], string> =>
	pipe(
		text,
		parse,
		(x) => R.fromExecution(() => x),
		R.flatMap((x) =>
			R.fromExecution(() => schemaInformationSchema.array().parse(x)),
		),
		R.mapError((x) => `getSchemaInformationError: ${x}`),
	);

export const schemaInformationToText = (
	schemaInformation: SchemaInformation,
): string[] => {
	const result = [
		`export const ${schemaInformation.tableName} = z.object({\n`,
		...schemaInformation.properties.map((x) => `${x.name}: ${x.schema},\n`),
		"});\n",
	];
	return result;
};

export const getOutputFilePath = (option: MysqlToZodOption): string =>
	join(
		option.output?.outDir ?? "./mysqlToZod",
		option.output?.fileName ?? "schema.ts",
	);

export type ParseZodSchemaFileProps = {
	option: MysqlToZodOption;
	tableNames: readonly string[];
};
export const readText = (path: string) => () => readFileSync(path, "utf-8");
