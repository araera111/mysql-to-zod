import { A, O, pipe } from "@mobily/ts-belt";
import { Either, isLeft, right } from "fp-ts/lib/Either";
import { produce } from "immer";
import { SchemaInformation } from "../../features/sync/types/syncType";
import { MysqlToZodOption } from "../../options/options";
import { Column, SchemaResult } from "./types/buildSchemaTextType";
import { strListToStrLf } from "./utils/buildSchemaTextUtil";
import { createSchemaFile } from "./utils/createSchemaFile";
import { getTableDefinition } from "./utils/getTableDefinition";

type BuildSchemaTextParams = {
	tables: string[];
	option: MysqlToZodOption;
	schemaInformationList: readonly SchemaInformation[] | undefined;
};

type BuildSchemaTextResult = {
	text: string;
	columns: Column[];
};

export const buildSchemaText = async ({
	tables,
	option,
	schemaInformationList,
}: BuildSchemaTextParams): Promise<Either<string, BuildSchemaTextResult>> => {
	const importDeclaration = produce(['import { z } from "zod";'], (draft) => {
		if (!option.schema?.inline)
			draft.push("import { globalSchema } from './globalSchema';");
	}).join("\n");

	const loop = async (
		restTables: readonly string[],
		result: SchemaResult,
	): Promise<Either<string, SchemaResult>> => {
		if (A.isEmpty(restTables)) return right(result);
		/* isEmptyで調べているのでgetExnを使用する */
		const headTable = pipe(restTables, A.head, O.getExn);
		const tailTables = pipe(restTables, A.tail, O.getExn);

		const tableDefinition = await getTableDefinition(
			headTable,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			option.dbConnection as any,
		);
		const schemaTextEither = createSchemaFile(
			tableDefinition,
			option,
			schemaInformationList,
		);
		if (isLeft(schemaTextEither)) return schemaTextEither;

		const newResult = strListToStrLf([
			result.schema,
			schemaTextEither.right.schema,
		]);

		return loop(tailTables, {
			schema: newResult,
			columns: [...result.columns, ...schemaTextEither.right.columns],
		});
	};
	const schemaTexts = await loop(tables, {
		schema: "",
		columns: [],
	});
	if (isLeft(schemaTexts)) return schemaTexts;

	return right({
		text: strListToStrLf([importDeclaration, schemaTexts.right.schema]),
		columns: schemaTexts.right.columns,
	});
};
