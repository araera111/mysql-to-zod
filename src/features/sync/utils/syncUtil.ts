import { R, pipe } from "@mobily/ts-belt";
import { readFileSync } from "fs-extra";
import { join } from "path";
import { match } from "ts-pattern";
import { MysqlToZodOption } from "../../../options";
import { SchemaInformation } from "../types/syncType";
import { parse } from "./zodParse";

export const getSchemaInformation = (text: string): SchemaInformation[] => {
	const result = parse(text);
	return result as SchemaInformation[];
};

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
	join(option.output?.outDir ?? "./mysqlToZod", option.output?.fileName ?? "");

type ParseZodSchemaFileProps = {
	option: MysqlToZodOption;
	tableNames: readonly string[];
};
const readText = (path: string) => () => readFileSync(path, "utf-8");
export const parseZodSchemaFile = async ({
	option,
	tableNames,
}: ParseZodSchemaFileProps): Promise<
	R.Result<
		{
			schemaInformationList: readonly SchemaInformation[];
			tableNames: readonly string[];
			option: MysqlToZodOption;
		},
		string
	>
> => {
	return pipe(option?.sync?.active ?? false, (x) =>
		match(x)
			.with(true, () =>
				pipe(
					getOutputFilePath(option),
					(x) => R.fromExecution(readText(x)),
					R.map((x) => ({
						schemaInformationList: getSchemaInformation(x),
						tableNames,
						option,
					})),
					R.mapError((x) => `parseZodSchemaFileError: ${x}`),
				),
			)
			.with(false, () =>
				R.Ok({ schemaInformationList: [], tableNames, option }),
			)
			.exhaustive(),
	);
};
