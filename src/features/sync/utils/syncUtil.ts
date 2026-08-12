import { join } from "node:path";
import { Effect, pipe } from "effect";
import { readFileSync } from "fs-extra";
import { match } from "ts-pattern";
import type { MysqlToZodOption } from "../../../options";
import {
	type SchemaInformation,
	schemaInformationSchema,
} from "../types/syncType";
import { parse } from "./zodParse";

export const getSchemaInformation = (text: string): SchemaInformation[] => {
	const parsed = parse(text);
	return parsed.flatMap((x) => {
		const r = schemaInformationSchema.safeParse(x);
		return r.success ? [r.data] : [];
	});
};

export const schemaInformationToText = (
	schemaInformation: SchemaInformation,
): string[] => {
	return [
		`export const ${schemaInformation.tableName} = z.object({\n`,
		...schemaInformation.properties.map((x) => `${x.name}: ${x.schema},\n`),
		"});\n",
	];
};

const getOutputFilePath = (option: MysqlToZodOption): string =>
	join(option.output?.outDir ?? "./mysqlToZod", option.output?.fileName ?? "");

type ParseZodSchemaFileProps = {
	option: MysqlToZodOption;
	tableNames: readonly string[];
};
export const parseZodSchemaFile = ({
	option,
	tableNames,
}: ParseZodSchemaFileProps): Effect.Effect<
	{
		schemaInformationList: SchemaInformation[];
		tableNames: readonly string[];
		option: MysqlToZodOption;
	},
	string
> =>
	match(option?.sync?.active ?? false)
		.with(true, () =>
			pipe(
				getOutputFilePath(option),
				(path) =>
					Effect.try({
						try: () => readFileSync(path, "utf-8"),
						catch: (x) => `parseZodSchemaFileError: ${String(x)}`,
					}),
				Effect.map((x) => ({
					schemaInformationList: getSchemaInformation(x),
					tableNames,
					option,
				})),
			),
		)
		.with(false, () =>
			Effect.succeed({
				schemaInformationList: [],
				tableNames,
				option,
			}),
		)
		.exhaustive();
