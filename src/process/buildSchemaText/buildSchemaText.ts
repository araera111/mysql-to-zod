import { A, O, R, pipe } from "@mobily/ts-belt";
import { produce } from "immer";
import { SchemaInformation } from "../../features/sync/types/syncType";
import { MysqlToZodOption } from "../../options/options";
import { Column, SchemaResult } from "./types/buildSchemaTextType";
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

export const buildSchemaText = async ({
	tables,
	option,
	schemaInformationList,
}: BuildSchemaTextParams): Promise<R.Result<BuildSchemaTextResult, string>> => {
	const importDeclaration = produce(['import { z } from "zod";'], (draft) => {
		if (!option.schema?.inline)
			draft.push("import { globalSchema } from './globalSchema';");
	}).join("\n");

	const loop = async (
		restTables: readonly string[],
		result: SchemaResult,
	): Promise<R.Result<SchemaResult, string>> => {
		if (A.isEmpty(restTables)) return R.Ok(result);
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

		return R.match(
			schemaTextEither,
			(ok) => {
				const nextResult = produce(result, (draft) => {
					draft.schema += ok.schema;
					draft.columns.push(...ok.columns);
				});
				return loop(tailTables, nextResult);
			},
			async (err) => {
				return await R.Error(err);
			},
		);
	};
	const schemaTexts = await loop(tables, {
		schema: "",
		columns: [],
	});

	return R.flatMap(schemaTexts, (x) => {
		const text = strListToStrLf([importDeclaration, x.schema]);
		return R.Ok({ text, columns: x.columns, option });
	});
};
