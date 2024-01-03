import { R, pipe } from "@mobily/ts-belt";
import { match } from "ts-pattern";

import { MysqlToZodOption } from "../../options";
import { SchemaInformation } from "./types/syncType";
import {
	ParseZodSchemaFileProps,
	getOutputFilePath,
	getSchemaInformation,
	readText,
} from "./utils/syncUtil";

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
