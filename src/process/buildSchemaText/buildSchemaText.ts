import { Effect } from "effect";
import type { SchemaInformation } from "../../features/sync/types/syncType";
import { outputDefaults } from "../../options";
import type { MysqlToZodOption } from "../../options/options";
import type { Column, SchemaResult } from "./types/buildSchemaTextType";
import { strListToStrLf } from "./utils/buildSchemaTextUtil";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";

type BuildSchemaTextParams = {
	tables: readonly string[];
	option: MysqlToZodOption;
	schemaInformationList: readonly SchemaInformation[];
};

type BuildSchemaTextResult = {
	text: string;
	columns: Column[];
	option: MysqlToZodOption;
};

const buildImportDeclaration = (option: MysqlToZodOption): string => {
	const imports = ['import { z } from "zod";'];
	if (!option.schema?.inline) {
		// get global schema file name, from config or default, strip trailing file extension (.ts)
		// this implies filename cannot have a period other than the extension delimiter
		const globalSchemaFileName = (
			option.output?.globalSchemaFileName || outputDefaults.globalSchemaFileName
		).split(".")[0];
		imports.push(`import { globalSchema } from './${globalSchemaFileName}';`);
	}
	return imports.join("\n");
};

export const buildSchemaText = ({
	tables,
	option,
	schemaInformationList,
}: BuildSchemaTextParams): Effect.Effect<BuildSchemaTextResult, string> =>
	Effect.gen(function* () {
		const schemas: SchemaResult[] = yield* Effect.all(
			tables.map((table) =>
				Effect.gen(function* () {
					const definition = yield* getTableDefinition({
						tableName: table,
						option,
					});
					return yield* createSchemaFile(
						definition,
						option,
						schemaInformationList,
					);
				}),
			),
		);

		const text = strListToStrLf([
			buildImportDeclaration(option),
			schemas.map((x) => x.schema).join("\n"),
		]);
		return {
			text,
			columns: schemas.flatMap((x) => x.columns),
			option,
		};
	});
